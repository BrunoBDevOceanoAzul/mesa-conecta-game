import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, content_type, content_key, current_text, brand, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é a agência criativa premium da ${brand || "HIVIUM"}.

Sua personalidade combina força narrativa e simbólica com inteligência estratégica e precisão de copy.

Regras:
- Tom sofisticado, magnético, estratégico
- Textos bonitos mas úteis, emocionais mas inteligentes
- Evite clichês, jargão vazio, marketingês sem alma
- Nunca soe como IA genérica
- A marca deve parecer premium, viva, acolhedora, culturalmente relevante
- Termos proprietários: "Perfil Calibrado", "Insígnias", "Câmara da Comunidade", "Centro de Operações"

Contexto da marca: ${context || "Plataforma tabletop premium"}

Gere EXATAMENTE 5 variantes de texto para o campo solicitado.
Responda APENAS em JSON válido no formato: { "variants": ["texto1", "texto2", "texto3", "texto4", "texto5"] }
Nenhum texto antes ou depois do JSON.`;

    const userPrompt = `Seção: ${section}
Tipo de conteúdo: ${content_type}
Chave: ${content_key}
Texto atual: ${current_text || "(vazio - crie do zero)"}

Gere 5 variantes:
1. Versão emocional (força narrativa e desejo)
2. Versão comercial (clareza e conversão)
3. Versão curta (impacto em poucas palavras)
4. Versão sofisticada (elegância e posicionamento)
5. Versão SEO (otimizada para descoberta)`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { variants: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
