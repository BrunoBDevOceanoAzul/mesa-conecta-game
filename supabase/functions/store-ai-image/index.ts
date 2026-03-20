import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { prompt, event_type, store_name, city } = await req.json();

    if (!prompt && !event_type) throw new Error("prompt or event_type is required");

    // Build enhanced prompt based on event type
    let imagePrompt = prompt || "";

    if (!prompt && event_type) {
      const eventPrompts: Record<string, string> = {
        board_game_night: `A vibrant, warm illustration of a board game night at "${store_name}" game café. People gathered around tables playing board games, warm ambient lighting, shelves full of colorful board games, cozy atmosphere, drinks on tables.`,
        rpg_session: `An epic RPG session happening at "${store_name}" game store. A game master narrating behind a screen, players around the table with character sheets and dice, dramatic lighting, fantasy map on the table, immersive atmosphere.`,
        tournament: `A competitive board game tournament at "${store_name}". Players focused on strategy games, trophy on display, spectators watching, energetic atmosphere, banners and decorations, professional gaming event.`,
        kids_event: `A family-friendly game event for kids at "${store_name}". Children happily playing colorful board games, parents watching, bright cheerful environment, balloons and decorations, fun educational atmosphere.`,
        open_day: `An open house event at "${store_name}" game café in ${city || "Brazil"}. Welcoming entrance, people discovering board games for the first time, staff demonstrating games, warm inviting atmosphere, special promotions visible.`,
        workshop: `A board game workshop at "${store_name}". An instructor teaching game mechanics, engaged participants, prototype games on table, creative collaborative environment, whiteboards with game design notes.`,
        seasonal: `A seasonal celebration event at "${store_name}" game store. Festive decorations, themed board games, special seasonal drinks, cozy holiday atmosphere, people enjoying games together.`,
        custom: `A special event at "${store_name}" board game café. Exciting atmosphere, people engaged in tabletop gaming, warm lighting, well-organized game space.`,
      };
      imagePrompt = eventPrompts[event_type] || eventPrompts.custom;
    }

    const finalPrompt = `${imagePrompt}. Style: modern digital illustration, warm color palette, welcoming commercial art suitable for social media promotion. High quality, 16:9 landscape aspect ratio, no text or letters in the image. Professional event marketing visual.`;

    console.log("[STORE-AI-IMAGE] Generating:", finalPrompt.substring(0, 100));

    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: finalPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("[STORE-AI-IMAGE] AI error:", aiResponse.status, errText);
      throw new Error("Falha ao gerar imagem");
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) throw new Error("Nenhuma imagem gerada");

    // Upload to storage
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${userData.user.id}/event-${Date.now()}.png`;

    // Ensure bucket exists — use mesa-covers bucket (already exists)
    const { error: uploadError } = await supabase.storage
      .from("mesa-covers")
      .upload(path, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("mesa-covers").getPublicUrl(path);

    console.log("[STORE-AI-IMAGE] Uploaded:", urlData.publicUrl);

    return new Response(JSON.stringify({
      image_url: urlData.publicUrl,
      prompt_used: finalPrompt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STORE-AI-IMAGE] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
