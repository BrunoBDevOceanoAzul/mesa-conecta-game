import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
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

    const body = await req.json();
    const { action, mesa_id } = body;

    // Fetch mesa data
    if (!mesa_id) throw new Error("mesa_id is required");

    const { data: mesa, error: mesaError } = await supabase
      .from("mesas")
      .select("*")
      .eq("id", mesa_id)
      .single();

    if (mesaError || !mesa) throw new Error("Mesa not found");
    if (mesa.gm_id !== userData.user.id) throw new Error("Not your mesa");

    const mesaContext = `
DADOS DA MESA:
- Título: ${mesa.title}
- Sistema de RPG: ${mesa.system}
- Descrição: ${mesa.description || "não informada"}
- Formato: ${mesa.format} (${mesa.session_type})
- Vagas: ${mesa.seats_available}/${mesa.seats_total}
- Preço: R$${mesa.min_price || 0}${mesa.max_price ? ` - R$${mesa.max_price}` : ""}
- Tags: ${(mesa.tags || []).join(", ") || "nenhuma"}
- Estilos de jogo: ${(mesa.play_styles || []).join(", ") || "nenhum"}
- Nome do Mestre: ${mesa.gm_name}
- Cidade: ${mesa.city || "online"}
- Local: ${mesa.venue || "não informado"}
`;

    const baseSystemPrompt = `Você é a assistente criativa da HIVIUM, plataforma premium para RPG de mesa.
Escreva SEMPRE em português brasileiro. Seja criativo, específico para o sistema de RPG e evite clichês.`;

    let aiPayload: any;

    switch (action) {
      case "session_script": {
        aiPayload = {
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `${baseSystemPrompt}\n\nVocê gera roteiros de sessão completos e prontos para jogar.` },
            { role: "user", content: `${mesaContext}\n\nCrie um roteiro de sessão detalhado para esta mesa. Inclua:
1. GANCHO INICIAL — Como os personagens são introduzidos na aventura
2. ATOS (3 atos narrativos com cenas, desafios e encontros)
3. NPCs PRINCIPAIS — Nome, motivação, personalidade e dica de interpretação
4. ENCONTROS-CHAVE — Pelo menos 2 combates/desafios com dificuldade sugerida
5. REVIRAVOLTAS — 2-3 plot twists opcionais
6. DESFECHO — Possíveis finais e ganchos para próxima sessão
7. TRILHA SONORA — 3-5 sugestões de músicas/playlists para ambientação

Seja específico para o sistema ${mesa.system}. Formate com markdown rico.` },
          ],
        };
        break;
      }

      case "video_script": {
        aiPayload = {
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `${baseSystemPrompt}\n\nVocê cria roteiros para vídeos curtos promocionais de mesas de RPG (Reels/TikTok/Shorts, 30-60 segundos).` },
            { role: "user", content: `${mesaContext}\n\nCrie um roteiro de vídeo curto (30-60 segundos) para o Mestre divulgar esta mesa nas redes sociais. Inclua:

1. HOOK (0-3s) — Frase de abertura que prende atenção
2. APRESENTAÇÃO (3-15s) — O que é a aventura, sistema e tom
3. DIFERENCIAL (15-30s) — Por que esta mesa é especial
4. CALL TO ACTION (30s+) — Chamada para reservar vaga

Para cada trecho, inclua:
- Texto falado (narração)
- Texto na tela (overlay)
- Sugestão visual (o que mostrar/filmar)
- Música/efeito sonoro sugerido

Formate com markdown. O tom deve ser épico mas acessível.` },
          ],
        };
        break;
      }

      case "post_image": {
        // Generate image prompt and then generate the image
        const promptResponse = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: `You generate image prompts for social media posts about tabletop RPG sessions. Write in English. Be specific and cinematic.` },
              { role: "user", content: `Create an image generation prompt for a social media post about this RPG table:
- Title: ${mesa.title}
- RPG System: ${mesa.system}
- Description: ${mesa.description || "adventure session"}
- Format: ${mesa.format}
- Style: ${(mesa.play_styles || []).join(", ") || "classic"}

The image should be a striking 1080x1080 social media post style. It should evoke the mood and genre of the RPG system. NO TEXT in the image. Cinematic quality, dramatic lighting, fantasy/sci-fi atmosphere matching the system.

Return ONLY the image prompt, nothing else.` },
            ],
          }),
        });

        if (!promptResponse.ok) {
          if (promptResponse.status === 429) {
            return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (promptResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error("AI prompt generation failed");
        }

        const promptData = await promptResponse.json();
        const imagePrompt = promptData.choices?.[0]?.message?.content || "Epic fantasy RPG scene, cinematic lighting, dramatic atmosphere";

        // Generate the image
        const imageResponse = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!imageResponse.ok) {
          if (imageResponse.status === 429) {
            return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (imageResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error("Image generation failed");
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) throw new Error("No image generated");

        // Generate caption text
        const captionResponse = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            tools: [{
              type: "function",
              function: {
                name: "post_caption",
                description: "Generate social media caption for the RPG table post",
                parameters: {
                  type: "object",
                  properties: {
                    caption_instagram: { type: "string", description: "Caption para Instagram (até 2200 chars, com hashtags)" },
                    caption_twitter: { type: "string", description: "Caption para Twitter/X (até 280 chars)" },
                    caption_whatsapp: { type: "string", description: "Mensagem para WhatsApp (informal, com emojis)" },
                  },
                  required: ["caption_instagram", "caption_twitter", "caption_whatsapp"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "post_caption" } },
            messages: [
              { role: "system", content: `${baseSystemPrompt}\n\nVocê cria legendas engajantes para posts de redes sociais sobre mesas de RPG.` },
              { role: "user", content: `${mesaContext}\n\nCrie legendas para post de divulgação desta mesa em 3 formatos: Instagram (com hashtags), Twitter/X (curto) e WhatsApp (informal).` },
            ],
          }),
        });

        const captionData = await captionResponse.json();
        const captionToolCall = captionData.choices?.[0]?.message?.tool_calls?.[0];
        const captions = captionToolCall?.function?.arguments ? JSON.parse(captionToolCall.function.arguments) : {};

        return new Response(JSON.stringify({
          action: "post_image",
          result: {
            image_url: imageUrl,
            image_prompt: imagePrompt,
            captions,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // For text-based actions (session_script, video_script)
    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
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
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content generated");

    return new Response(JSON.stringify({ action, result: { content } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[GM-CONTENT-STUDIO] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
