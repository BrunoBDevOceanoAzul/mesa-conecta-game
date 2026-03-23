import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, mesa_id, mesa_context, stream = true } = await req.json();
    if (!question) throw new Error("question is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Search knowledge base
    const { data: results, error: searchErr } = await supabase.rpc("search_knowledge", {
      _query: question,
      _mesa_id: mesa_id || null,
      _source_types: null,
      _limit: 8,
    });

    if (searchErr) {
      console.error("Search error:", searchErr);
    }

    // Build context from search results
    const contextParts: string[] = [];
    if (results && results.length > 0) {
      for (const r of results) {
        contextParts.push(`[${r.source_type} — ${r.document_title}]\n${r.content}`);
      }
    }

    // If mesa_id provided, fetch mesa details for extra context
    let mesaInfo = "";
    if (mesa_id) {
      const { data: mesa } = await supabase
        .from("mesas")
        .select("title, system, description, format, session_type, tags")
        .eq("id", mesa_id)
        .maybeSingle();

      if (mesa) {
        mesaInfo = `\n\nCONTEXTO DA MESA ATUAL:\nTítulo: ${mesa.title}\nSistema: ${mesa.system}\nFormato: ${mesa.format}\nTipo: ${mesa.session_type}\nDescrição: ${mesa.description || "—"}\nTags: ${(mesa.tags || []).join(", ")}`;
      }
    }

    const ragContext = contextParts.length > 0
      ? `\n\nCONTEXTO DA BASE DE CONHECIMENTO:\n${contextParts.join("\n\n---\n\n")}`
      : "";

    const systemPrompt = `Você é o Assistente da HIVIUM, uma plataforma para RPG de mesa e jogos de tabuleiro.
Você ajuda mestres (GMs) a conduzir sessões, consultar regras, planejar narrativas e resolver dúvidas sobre a plataforma.

REGRAS:
- Responda sempre em português brasileiro
- Seja objetivo e prático
- Se tiver informação na base de conhecimento, use-a como referência principal
- Se não souber, diga que não tem a informação ao invés de inventar
- Para regras de RPG, baseie-se no sistema da mesa quando possível
- Formate respostas em markdown quando apropriado
- Mantenha respostas concisas mas completas${mesaInfo ? `\n\n${mesa_context || ""}` : ""}${mesaInfo}${ragContext}`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(
      JSON.stringify({
        answer,
        sources: (results || []).map((r: any) => ({
          title: r.document_title,
          type: r.source_type,
          rank: r.rank,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("knowledge-query error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
