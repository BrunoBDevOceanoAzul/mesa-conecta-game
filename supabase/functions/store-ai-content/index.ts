import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, store_name, city, description, features, capacity } = await req.json();

    const systemPrompt = `Você é um copywriter especialista em luderias, board games cafés e espaços de RPG no Brasil. 
Gere conteúdo profissional, atrativo e com tom acolhedor que transmita a experiência única do espaço.
Sempre use português brasileiro. Seja criativo mas mantenha autenticidade.`;

    let userPrompt = "";

    if (type === "description") {
      userPrompt = `Gere uma descrição envolvente para a luderia "${store_name}" em ${city || "Brasil"}.
${description ? `Info existente: ${description}` : ""}
${features ? `Diferenciais: ${features}` : ""}
${capacity ? `Capacidade: ${capacity} pessoas` : ""}
A descrição deve ter 2-3 parágrafos, destacar o ambiente, comunidade e experiência. Retorne apenas o texto.`;
    } else if (type === "social_post") {
      userPrompt = `Crie um post de Instagram para a luderia "${store_name}" em ${city || "Brasil"}.
${description ? `Sobre: ${description}` : ""}
Inclua: texto com emojis (max 200 chars), 5 hashtags relevantes, e uma sugestão de CTA.
Formato:
TEXTO: ...
HASHTAGS: ...
CTA: ...`;
    } else if (type === "welcome_message") {
      userPrompt = `Crie uma mensagem de boas-vindas para novos visitantes da luderia "${store_name}".
${description ? `Sobre: ${description}` : ""}
Deve ser calorosa, breve (max 150 chars) e convidar a explorar o espaço.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: description, social_post, welcome_message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido, tente novamente em breve." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("store-ai-content error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
