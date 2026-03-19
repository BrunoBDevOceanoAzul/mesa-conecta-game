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
    const { action, title, description, system, session_type, format, tags, play_styles, url, channels } = body;

    // Gather platform performance insights for context
    let platformContext = "";
    try {
      const { data: topMesas } = await supabase
        .from("mesas")
        .select("title, description, system, tags, seats_total, seats_available, min_price")
        .eq("status", "aberta")
        .order("created_at", { ascending: false })
        .limit(20);

      if (topMesas && topMesas.length > 0) {
        const popularSystems = [...new Set(topMesas.map((m: any) => m.system))].slice(0, 5);
        const popularTags = [...new Set(topMesas.flatMap((m: any) => m.tags || []))].slice(0, 10);
        const avgOccupancy = topMesas.reduce((acc: number, m: any) => {
          const filled = (m.seats_total - m.seats_available) / m.seats_total;
          return acc + filled;
        }, 0) / topMesas.length;

        platformContext = `
DADOS DA PLATAFORMA (use para melhorar sugestões):
- Sistemas mais populares: ${popularSystems.join(", ")}
- Tags mais usadas: ${popularTags.join(", ")}
- Taxa média de ocupação: ${Math.round(avgOccupancy * 100)}%
- Total de mesas ativas: ${topMesas.length}
`;
      }
    } catch (e) {
      console.log("Could not fetch platform context:", e);
    }

    const mesaContext = `
MESA DO MESTRE:
- Sistema: ${system || "não informado"}
- Título: ${title || "não informado"}
- Descrição: ${description || "não informada"}
- Tipo: ${session_type || "não informado"}
- Formato: ${format || "não informado"}
- Tags: ${(tags || []).join(", ") || "nenhuma"}
- Estilos: ${(play_styles || []).join(", ") || "nenhum"}
`;

    const systemPrompt = `Você é a assistente de criação de mesas da HIVIUM, uma plataforma premium para RPG de mesa.

Seu papel é ajudar Mestres a criar páginas de mesa mais atraentes, claras e com melhor taxa de descoberta e conversão.

REGRAS:
- Seja específica para o sistema de RPG e tom da aventura
- Nunca produza texto genérico ou clichê
- Mantenha coerência entre título, descrição e proposta
- Priorize clareza, gancho narrativo e informação prática
- Escreva em português brasileiro
- Considere SEO interno (busca na HIVIUM) e externo
- Não exagere nem faça promessas irreais
- Responda APENAS em JSON válido, sem markdown

${platformContext}`;

    let userPrompt = "";
    let tools: any[] | undefined;
    let toolChoice: any | undefined;

    switch (action) {
      case "improve_description":
        tools = [{
          type: "function",
          function: {
            name: "improved_description",
            description: "Return improved description variants",
            parameters: {
              type: "object",
              properties: {
                improved: { type: "string", description: "Versão melhorada, mais clara e atrativa" },
                short: { type: "string", description: "Versão curta (2-3 frases) para preview/card" },
                seo: { type: "string", description: "Versão otimizada para SEO e descoberta" },
              },
              required: ["improved", "short", "seo"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "improved_description" } };
        userPrompt = `${mesaContext}\n\nMelhore a descrição desta mesa. Crie 3 versões: uma melhorada (mais clara e atrativa), uma curta (2-3 frases para preview), e uma otimizada para SEO e descoberta.`;
        break;

      case "improve_title":
        tools = [{
          type: "function",
          function: {
            name: "improved_titles",
            description: "Return title suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "improved_titles" } };
        userPrompt = `${mesaContext}\n\nSugira 3 títulos alternativos para esta mesa. Cada um deve ser mais claro, mais atrativo ou mais fácil de encontrar. Explique brevemente o motivo de cada sugestão.`;
        break;

      case "suggest_tags":
        tools = [{
          type: "function",
          function: {
            name: "suggested_tags",
            description: "Return tag and keyword suggestions",
            parameters: {
              type: "object",
              properties: {
                tags: { type: "array", items: { type: "string" }, description: "5-8 tags relevantes" },
                keywords: { type: "array", items: { type: "string" }, description: "Palavras-chave para SEO" },
                meta_description: { type: "string", description: "Meta description curta (até 155 chars)" },
              },
              required: ["tags", "keywords", "meta_description"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "suggested_tags" } };
        userPrompt = `${mesaContext}\n\nSugira tags, palavras-chave e meta description para esta mesa. Pense em termos que jogadores usariam para buscar este tipo de experiência.`;
        break;

      case "generate_cover_prompt":
        tools = [{
          type: "function",
          function: {
            name: "cover_prompts",
            description: "Return image generation prompts",
            parameters: {
              type: "object",
              properties: {
                prompts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prompt: { type: "string", description: "Prompt de geração de imagem em inglês" },
                      style: { type: "string", description: "Nome do estilo visual" },
                      description_pt: { type: "string", description: "Descrição curta do estilo em português" },
                    },
                    required: ["prompt", "style", "description_pt"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["prompts"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "cover_prompts" } };
        userPrompt = `${mesaContext}\n\nGere 3 prompts de imagem (em inglês) para capa de aventura de RPG. Cada um com estilo visual diferente. Os prompts devem gerar imagens no formato landscape (16:9), com qualidade de poster cinematográfico, sem texto na imagem. Considere o sistema de RPG, o tom da aventura e o público-alvo.`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: toolChoice,
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
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ action, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[MESA-AI-ASSIST] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
