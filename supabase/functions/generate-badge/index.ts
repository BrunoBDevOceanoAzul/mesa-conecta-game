import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { context, type } = await req.json();

    // type: "refine_badge" | "profile_summary" | "badge_variation"
    let systemPrompt = "";
    let userPrompt = "";

    if (type === "refine_badge") {
      systemPrompt = `Você é o escritor criativo da HIVIUM, uma plataforma premium de RPG de mesa. 
Gere microcopy elegante para badges gamificados de mestres de RPG.
Responda SEMPRE em JSON válido com exatamente este formato:
{
  "badge_name": "nome refinado do badge",
  "short_description": "descrição curta até 80 caracteres",
  "flavor_text": "frase temática até 60 caracteres, tom épico/motivacional",
  "rarity": "common|rare|epic|legendary",
  "category": "founder|consistency|growth|community|quality"
}
Use tom épico mas acessível. Misture RPG com empreendedorismo. Nunca quebre o JSON.`;
      userPrompt = `Refine este badge para um mestre de RPG na plataforma HIVIUM:
Nome original: ${context.name}
Descrição: ${context.description}
Categoria: ${context.category}
Contexto do mestre: ${context.master_context || "mestre ativo na plataforma"}`;
    } else if (type === "profile_summary") {
      systemPrompt = `Você é o narrador da HIVIUM. Resuma o perfil gamificado de um mestre de RPG em 2-3 frases épicas mas profissionais.
Responda em JSON: { "summary": "texto do resumo", "title_suggestion": "título sugerido" }`;
      userPrompt = `Mestre com ${context.total_xp} XP, nível ${context.level}, título "${context.title}".
Badges: ${context.badges?.join(", ") || "nenhum"}.
Mesas publicadas: ${context.mesas_count || 0}. Reservas: ${context.bookings || 0}.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = { raw: content, error: "Could not parse JSON from AI response" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-badge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
