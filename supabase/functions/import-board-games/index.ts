import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function buildSearchText(item: any): string {
  const p = item.product || {};
  const parts = [
    p.name || "",
    p.slug || "",
    p.type || "",
    p.min_players != null ? String(p.min_players) : "",
    p.max_players != null ? String(p.max_players) : "",
    p.min_playtime != null ? String(p.min_playtime) : "",
    p.max_playtime != null ? String(p.max_playtime) : "",
  ];
  return parts.filter(Boolean).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth check - admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth failed");

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) throw new Error("Admin access required");

    const body = await req.json();
    const games: any[] = body.games || [];

    if (!Array.isArray(games) || games.length === 0) {
      throw new Error("No games data provided");
    }

    console.log(`[IMPORT] Starting import of ${games.length} games`);

    // Create import run
    const { data: importRun, error: runError } = await supabase
      .from("catalog_import_runs")
      .insert({
        source_name: "comparajogos",
        file_name: body.file_name || "jogos.json",
        total_records: games.length,
        status: "running",
      })
      .select("id")
      .single();

    if (runError) throw new Error(`Failed to create import run: ${runError.message}`);
    const runId = importRun.id;

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const batch = games.slice(i, i + BATCH_SIZE);
      const rows = batch.map((item: any) => {
        const p = item.product || {};
        const gameType = ["game", "expansion", "accessory", "rpg"].includes(p.type) ? p.type : "unknown";
        return {
          source_record_id: item.id,
          source_product_id: p.id || null,
          slug: p.slug || null,
          name: p.name || "Unknown",
          normalized_name: normalize(p.name || ""),
          type: gameType,
          playing_time: p.playing_time || null,
          min_playtime: p.min_playtime || null,
          max_playtime: p.max_playtime || null,
          min_players: p.min_players || null,
          max_players: p.max_players || null,
          thumbnail_url: p.thumbnail_url || null,
          bgg_rating: p.bgg_rating || null,
          bgg_ranking: p.bgg_ranking || null,
          weight_complexity: p.peso_jogo || null,
          own_count: p.count?.own || null,
          wish_count: p.count?.wish || null,
          min_price_new: item.min_price_new || null,
          min_price_used: item.min_price_used || null,
          new_count: item.new_count || null,
          used_count: item.used_count || null,
          is_available: item.available || false,
          current_game_value: item.valor_atual_jogo || null,
          average_rental_value: item.media_valores_alugual_jogo || null,
          raw_json: item,
          search_text: buildSearchText(item),
        };
      });

      const { error: insertError, data: insertedData } = await supabase
        .from("board_games_catalog")
        .upsert(rows, { onConflict: "source_record_id", ignoreDuplicates: false })
        .select("id, name, normalized_name");

      if (insertError) {
        failed += batch.length;
        errors.push(`Batch ${i}-${i + batch.length}: ${insertError.message}`);
        console.error(`[IMPORT] Batch error:`, insertError.message);
      } else {
        imported += insertedData?.length || batch.length;

        // Create normalized aliases for each game
        if (insertedData) {
          const aliases = insertedData
            .filter((g: any) => g.normalized_name && g.normalized_name !== g.name?.toLowerCase())
            .map((g: any) => ({
              board_game_id: g.id,
              alias: g.normalized_name,
              normalized_alias: g.normalized_name,
              alias_type: "normalized",
            }));

          if (aliases.length > 0) {
            await supabase.from("board_game_aliases").upsert(aliases, {
              onConflict: "board_game_id,alias",
              ignoreDuplicates: true,
            }).then(() => {});
          }
        }
      }
    }

    // Update import run
    await supabase.from("catalog_import_runs").update({
      imported_records: imported,
      failed_records: failed,
      finished_at: new Date().toISOString(),
      status: failed === 0 ? "completed" : (imported > 0 ? "completed" : "failed"),
      logs_json: errors.length > 0 ? errors : [],
    }).eq("id", runId);

    console.log(`[IMPORT] Done: ${imported} imported, ${failed} failed`);

    return new Response(JSON.stringify({
      run_id: runId,
      total: games.length,
      imported,
      failed,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[IMPORT] ERROR:`, msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
