import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, title, gameName, format, city, seats, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "generate_description") {
      const prompt = `Você é um redator especialista em comunidades de jogos de tabuleiro e RPG no Brasil.

Gere uma descrição CURTA e CONVIDATIVA (máx 3 frases, ~200 caracteres) para uma mesa de jogo com estas informações:
- Jogo: ${gameName || title}
- Formato: ${format}
${city ? `- Cidade: ${city}` : ""}
- Vagas: ${seats}

A descrição deve:
1. Ser acolhedora e inclusiva (iniciantes bem-vindos)
2. Criar expectativa sobre a experiência
3. Usar linguagem informal mas respeitosa
4. NÃO repetir o nome do jogo no início

Responda APENAS com a descrição, sem aspas nem formatação.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em alguns segundos." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${resp.status}`);
      }

      const data = await resp.json();
      const generatedDescription = data.choices?.[0]?.message?.content?.trim() || "";

      return new Response(JSON.stringify({ description: generatedDescription }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_share_text") {
      const prompt = `Você é um organizador animado de jogos de tabuleiro. Crie uma mensagem CURTA para compartilhar em grupos de WhatsApp/Telegram convidando pessoas para uma mesa.

Dados:
- Jogo: ${gameName || title}
- Formato: ${format}
- Vagas: ${seats}
${city ? `- Local: ${city}` : ""}
${description ? `- Sobre: ${description}` : ""}

Regras:
1. Máximo 3 linhas + emoji relevante
2. Tom animado mas não exagerado  
3. Termine com "Bora?" ou convite similar
4. NÃO inclua links (será adicionado depois)
5. Use no máximo 2-3 emojis

Responda APENAS com a mensagem.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429 || status === 402) {
          return new Response(JSON.stringify({ error: status === 429 ? "Tente novamente em instantes." : "Créditos esgotados." }), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${status}`);
      }

      const data = await resp.json();
      const shareText = data.choices?.[0]?.message?.content?.trim() || "";

      return new Response(JSON.stringify({ shareText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mesa-community-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
