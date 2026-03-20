import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { mode, title, content, post_type, author_role } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "generate_text") {
      systemPrompt = `Você é um copywriter especialista em comunidades de RPG e jogos de mesa (tabletop). 
Gere conteúdo envolvente, autêntico e otimizado para SEO. 
Retorne APENAS um JSON válido com: { "title": "...", "content": "...", "tags": ["tag1","tag2","tag3"], "meta_description": "..." }
- title: chamativo, max 70 chars, com palavra-chave natural
- content: 2-4 parágrafos, tom conversacional mas profissional, com CTA sutil
- tags: 3-5 tags relevantes em português
- meta_description: max 155 chars para SEO`;

      userPrompt = `Gere um post do tipo "${post_type}" escrito por um "${author_role}".
${title ? `Tema/título sugerido: "${title}"` : "Tema livre sobre o universo tabletop."}
${content ? `Rascunho do autor: "${content}"` : ""}`;
    } else if (mode === "improve_text") {
      systemPrompt = `Você é um editor de conteúdo especializado em SEO e engajamento para comunidades de jogos de mesa.
Melhore o texto mantendo a voz do autor. Retorne APENAS JSON: { "title": "...", "content": "...", "tags": ["..."], "meta_description": "..." }`;

      userPrompt = `Melhore este post para SEO e engajamento:
Título: "${title || ""}"
Conteúdo: "${content}"
Tipo: ${post_type}, Papel do autor: ${author_role}`;
    } else if (mode === "generate_image_prompt") {
      systemPrompt = `Você é um diretor de arte especializado em RPG e jogos de mesa.
Crie um prompt em inglês para gerar uma imagem de capa de blog post.
Retorne APENAS JSON: { "image_prompt": "..." }
O prompt deve ser cinematográfico, evocativo e adequado para uma imagem de capa 16:9.`;

      userPrompt = `Crie um prompt de imagem para este post:
Título: "${title || "Post sobre RPG"}"
Conteúdo: "${content || ""}"
Tipo: ${post_type}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [{
          type: "function",
          function: {
            name: "blog_output",
            description: "Structured blog content output",
            parameters: mode === "generate_image_prompt" ? {
              type: "object",
              properties: { image_prompt: { type: "string" } },
              required: ["image_prompt"],
            } : {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                meta_description: { type: "string" },
              },
              required: ["title", "content", "tags", "meta_description"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "blog_output" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-ai-generate error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
