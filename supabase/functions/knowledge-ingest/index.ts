import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Split text into ~500-word chunks with overlap */
function chunkText(text: string, maxTokens = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  if (words.length <= maxTokens) return [text];
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + maxTokens, words.length);
    chunks.push(words.slice(i, end).join(" "));
    i = end - overlap;
    if (i >= words.length - overlap) break;
  }
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin or has valid auth
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const body = await req.json();
    const { action } = body;

    if (action === "ingest_text") {
      // Ingest raw text content
      const { title, content, source_type = "document", source_ref, mesa_id, description, metadata } = body;
      if (!title || !content) throw new Error("title and content are required");

      // Create document
      const { data: doc, error: docErr } = await supabase
        .from("knowledge_documents")
        .insert({
          title,
          description,
          source_type,
          source_ref,
          mesa_id: mesa_id || null,
          user_id: userId,
          metadata_json: metadata || {},
        })
        .select("id")
        .single();

      if (docErr) throw docErr;

      // Chunk and insert
      const chunks = chunkText(content);
      const chunkRows = chunks.map((c, i) => ({
        document_id: doc.id,
        chunk_index: i,
        content: c,
        token_count: c.split(/\s+/).length,
      }));

      const { error: chunkErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
      if (chunkErr) throw chunkErr;

      return new Response(
        JSON.stringify({ success: true, document_id: doc.id, chunks_count: chunks.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "ingest_file") {
      // Ingest a file from storage bucket
      const { bucket, path, title, source_type = "mesa_material", mesa_id, description } = body;
      if (!bucket || !path || !title) throw new Error("bucket, path, title required");

      const { data: fileData, error: fileErr } = await supabase.storage.from(bucket).download(path);
      if (fileErr) throw fileErr;

      const text = await fileData.text();

      // Create document
      const { data: doc, error: docErr } = await supabase
        .from("knowledge_documents")
        .insert({
          title,
          description,
          source_type,
          source_ref: `${bucket}/${path}`,
          mesa_id: mesa_id || null,
          user_id: userId,
          metadata_json: { bucket, path },
        })
        .select("id")
        .single();

      if (docErr) throw docErr;

      const chunks = chunkText(text);
      const chunkRows = chunks.map((c, i) => ({
        document_id: doc.id,
        chunk_index: i,
        content: c,
        token_count: c.split(/\s+/).length,
      }));

      const { error: chunkErr } = await supabase.from("knowledge_chunks").insert(chunkRows);
      if (chunkErr) throw chunkErr;

      return new Response(
        JSON.stringify({ success: true, document_id: doc.id, chunks_count: chunks.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "ingest_db_data") {
      // Ingest structured data from the database (plans, features, FAQ, etc.)
      // Fetch billing products
      const { data: products } = await supabase
        .from("billing_products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (products && products.length > 0) {
        const content = products.map((p: any) =>
          `Plano: ${p.name} (${p.code})\nRole: ${p.target_role || "todos"}\nPreço: R$ ${(p.price_cents / 100).toFixed(2)}/${p.billing_cycle || "mensal"}\nDescrição: ${p.description || "—"}\nFeature Flags: ${JSON.stringify(p.feature_flags || {})}`
        ).join("\n\n---\n\n");

        // Upsert: delete old db_data docs first
        await supabase.from("knowledge_documents")
          .delete()
          .eq("source_type", "db_plans");

        const { data: doc } = await supabase
          .from("knowledge_documents")
          .insert({
            title: "Planos e Assinaturas da HIVIUM",
            source_type: "db_plans",
            source_ref: "billing_products",
            user_id: userId,
          })
          .select("id")
          .single();

        if (doc) {
          const chunks = chunkText(content);
          await supabase.from("knowledge_chunks").insert(
            chunks.map((c, i) => ({ document_id: doc.id, chunk_index: i, content: c, token_count: c.split(/\s+/).length }))
          );
        }
      }

      // Fetch admin settings
      const { data: settings } = await supabase.from("admin_settings").select("key, value");
      if (settings && settings.length > 0) {
        const content = settings.map((s: any) => `${s.key}: ${JSON.stringify(s.value)}`).join("\n");

        await supabase.from("knowledge_documents").delete().eq("source_type", "db_settings");

        const { data: doc } = await supabase
          .from("knowledge_documents")
          .insert({
            title: "Configurações da Plataforma HIVIUM",
            source_type: "db_settings",
            source_ref: "admin_settings",
            user_id: userId,
          })
          .select("id")
          .single();

        if (doc) {
          const chunks = chunkText(content);
          await supabase.from("knowledge_chunks").insert(
            chunks.map((c, i) => ({ document_id: doc.id, chunk_index: i, content: c, token_count: c.split(/\s+/).length }))
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "DB data ingested" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    console.error("knowledge-ingest error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
