import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BADGE_TOOL = {
  type: "function",
  function: {
    name: "create_badge",
    description: "Create a refined badge for a HIVIUM RPG game master.",
    parameters: {
      type: "object",
      properties: {
        badge_name: { type: "string", description: "Badge name, max 4 words" },
        short_description: { type: "string", description: "Short description, max 120 chars" },
        flavor_text: { type: "string", description: "Thematic flavor text, max 140 chars, epic/motivational tone" },
        rarity: { type: "string", enum: ["common", "rare", "epic", "legendary"] },
        category: { type: "string", enum: ["founder", "consistency", "growth", "community", "quality"] },
      },
      required: ["badge_name", "short_description", "flavor_text", "rarity", "category"],
      additionalProperties: false,
    },
  },
};

const SUMMARY_TOOL = {
  type: "function",
  function: {
    name: "create_profile_summary",
    description: "Create a gamified profile summary for a HIVIUM game master.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "2-3 sentence epic but professional summary" },
        title_suggestion: { type: "string", description: "Suggested display title" },
      },
      required: ["summary", "title_suggestion"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { context, type } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let tools: unknown[] = [];
    let toolChoice: unknown = undefined;

    if (type === "refine_badge") {
      systemPrompt = `Você é o escritor criativo da HIVIUM, uma plataforma premium de RPG de mesa.
Gere microcopy elegante para badges gamificados de mestres de RPG.
Use tom épico mas acessível. Misture RPG com empreendedorismo.`;

      const stats = context.stats
        ? `\nEstatísticas: ${context.stats.totalTables || 0} mesas, ${context.stats.totalBookings || 0} reservas, ${context.stats.fillRate || 0}% ocupação, ${context.stats.positiveReviews || 0} avaliações positivas, ${context.stats.daysActive || 0} dias ativos.`
        : "";

      userPrompt = `Refine este badge para um mestre de RPG na plataforma HIVIUM:
Nome original: ${context.name}
Descrição: ${context.description || ""}
Categoria: ${context.category || "general"}
Mestre: ${context.displayName || context.master_context || "mestre ativo"}
Cidade: ${context.city || "não informada"}
Sistemas: ${(context.systems || []).join(", ") || "variados"}
Estilos: ${(context.style || []).join(", ") || "variados"}${stats}
${context.founderRank ? `Founder rank: #${context.founderRank} (entre os 10 primeiros mestres)` : ""}`;

      tools = [BADGE_TOOL];
      toolChoice = { type: "function", function: { name: "create_badge" } };

    } else if (type === "profile_summary") {
      systemPrompt = `Você é o narrador da HIVIUM. Resuma o perfil gamificado de um mestre de RPG em 2-3 frases épicas mas profissionais.`;

      userPrompt = `Mestre com ${context.total_xp} XP, nível ${context.level}, título "${context.title}".
Badges: ${context.badges?.join(", ") || "nenhum"}.
Mesas publicadas: ${context.mesas_count || 0}. Reservas: ${context.bookings || 0}.`;

      tools = [SUMMARY_TOOL];
      toolChoice = { type: "function", function: { name: "create_profile_summary" } };

    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use 'refine_badge' or 'profile_summary'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      tools,
      tool_choice: toolChoice,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: Record<string, unknown>;

    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        // Fallback: try content
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        parsed = JSON.parse(jsonStr.trim());
      }
    } else {
      // Fallback for non-tool-call responses
      const content = data.choices?.[0]?.message?.content || "{}";
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
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
