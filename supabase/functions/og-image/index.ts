import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generates a dynamic SVG-based OG image for mesas/entities.
 * Called as: /og-image?type=mesa&id=xxx
 * Returns a PNG via AI image generation or a pre-rendered SVG.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get("type") || "mesa";
    const entityId = url.searchParams.get("id");

    if (!entityId) {
      return new Response(JSON.stringify({ error: "Missing id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch mesa data
    const { data: mesa, error } = await supabase
      .from("mesas")
      .select("id, title, description, system, session_type, format, city, min_price, max_price, seats_total, seats_available, gm_name, start_at, cover_image_url, image_url")
      .eq("id", entityId)
      .single();

    if (error || !mesa) {
      return new Response(JSON.stringify({ error: "Entity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = (mesa.title || "Mesa HIVIUM").substring(0, 60);
    const system = mesa.system || "RPG";
    const gmName = mesa.gm_name || "Mestre";
    const format = mesa.format === "online" ? "🌐 Online" : mesa.format === "presencial" ? "📍 Presencial" : "🔄 Híbrido";
    const seats = `${mesa.seats_available ?? 0}/${mesa.seats_total ?? 0} vagas`;
    const sessionType = mesa.session_type === "one-shot" ? "One-Shot" : mesa.session_type === "campanha" ? "Campanha" : "Evento";
    const price = mesa.min_price ? `R$ ${Number(mesa.min_price).toFixed(0)}` : "Grátis";
    const city = mesa.city || "";

    // Generate SVG OG image
    const svg = generateOgSvg({ title, system, gmName, format, seats, sessionType, price, city });

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[OG-IMAGE] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function generateOgSvg(data: {
  title: string;
  system: string;
  gmName: string;
  format: string;
  seats: string;
  sessionType: string;
  price: string;
  city: string;
}): string {
  const { title, system, gmName, format, seats, sessionType, price, city } = data;

  // Truncate title for display
  const displayTitle = title.length > 45 ? title.substring(0, 42) + "..." : title;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="50%" style="stop-color:#16082a"/>
      <stop offset="100%" style="stop-color:#0f0520"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c9a84c"/>
      <stop offset="50%" style="stop-color:#f0d078"/>
      <stop offset="100%" style="stop-color:#c9a84c"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#c9a84c;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#c9a84c;stop-opacity:0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Hex pattern decoration -->
  <g opacity="0.08" stroke="#c9a84c" fill="none" stroke-width="1">
    ${Array.from({ length: 8 }, (_, i) =>
      Array.from({ length: 5 }, (_, j) => {
        const x = i * 160 - 40;
        const y = j * 140 + (i % 2 ? 70 : 0) - 40;
        return `<polygon points="${x},${y - 50} ${x + 43},${y - 25} ${x + 43},${y + 25} ${x},${y + 50} ${x - 43},${y + 25} ${x - 43},${y - 25}"/>`;
      }).join("")
    ).join("")}
  </g>

  <!-- Top accent line -->
  <rect x="60" y="40" width="120" height="3" fill="url(#gold)" rx="1.5"/>

  <!-- HIVIUM branding -->
  <text x="60" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#c9a84c" letter-spacing="4">HIVIUM</text>

  <!-- Badge: session type -->
  <rect x="60" y="110" width="${sessionType.length * 12 + 28}" height="32" rx="16" fill="#c9a84c" fill-opacity="0.15" stroke="#c9a84c" stroke-opacity="0.4" stroke-width="1"/>
  <text x="74" y="131" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#f0d078">${escapeXml(sessionType)}</text>

  <!-- Badge: system -->
  <rect x="${60 + sessionType.length * 12 + 40}" y="110" width="${system.length * 11 + 28}" height="32" rx="16" fill="#7c3aed" fill-opacity="0.2" stroke="#a78bfa" stroke-opacity="0.4" stroke-width="1"/>
  <text x="${74 + sessionType.length * 12 + 40}" y="131" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#c4b5fd">${escapeXml(system)}</text>

  <!-- Title -->
  <text x="60" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#f5f0e8" letter-spacing="-0.5">${escapeXml(displayTitle)}</text>

  <!-- Info row -->
  <g transform="translate(60, 280)">
    <text font-family="system-ui, sans-serif" font-size="18" fill="#a89f91">
      <tspan>🎲 ${escapeXml(gmName)}</tspan>
      <tspan dx="30">${escapeXml(format)}</tspan>
      <tspan dx="30">🎟️ ${escapeXml(seats)}</tspan>
      ${city ? `<tspan dx="30">📍 ${escapeXml(city)}</tspan>` : ""}
    </text>
  </g>

  <!-- Price -->
  <rect x="60" y="340" width="${price.length * 22 + 40}" height="52" rx="12" fill="#c9a84c" fill-opacity="0.15" stroke="#c9a84c" stroke-opacity="0.3" stroke-width="1"/>
  <text x="80" y="374" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="700" fill="#f0d078">${escapeXml(price)}</text>

  <!-- Bottom bar -->
  <rect x="0" y="580" width="1200" height="50" fill="#c9a84c" fill-opacity="0.08"/>
  <text x="60" y="612" font-family="system-ui, sans-serif" font-size="14" fill="#a89f91">mesa-conecta-game.lovable.app</text>
  <text x="1140" y="612" font-family="system-ui, sans-serif" font-size="14" fill="#c9a84c" text-anchor="end">Onde mesas certas encontram pessoas certas</text>

  <!-- Decorative corner -->
  <rect x="1080" y="40" width="60" height="3" fill="url(#gold)" rx="1.5"/>
  <rect x="1137" y="40" width="3" height="60" fill="url(#gold)" rx="1.5"/>
</svg>`;
}
