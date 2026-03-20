import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const BASE = "https://mesa-conecta-game.lovable.app";

    const staticPages = [
      { loc: "/", freq: "weekly", priority: "1.0" },
      { loc: "/explorar", freq: "daily", priority: "0.9" },
      { loc: "/feed", freq: "daily", priority: "0.8" },
      { loc: "/cadastro", freq: "monthly", priority: "0.7" },
      { loc: "/login", freq: "monthly", priority: "0.5" },
      { loc: "/para-lojas", freq: "monthly", priority: "0.7" },
      { loc: "/quem-somos", freq: "monthly", priority: "0.6" },
      { loc: "/contato", freq: "monthly", priority: "0.5" },
      { loc: "/privacidade", freq: "yearly", priority: "0.3" },
      { loc: "/termos", freq: "yearly", priority: "0.3" },
    ];

    // Fetch published posts
    const { data: posts } = await supabase
      .from("community_posts")
      .select("slug, id, updated_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(500);

    // Fetch published mesas
    const { data: mesas } = await supabase
      .from("game_tables")
      .select("id, slug, updated_at")
      .eq("status", "published")
      .limit(500);

    // Fetch GM profiles
    const { data: gms } = await supabase
      .from("profiles")
      .select("slug, updated_at")
      .eq("role", "gm")
      .eq("is_active", true)
      .not("slug", "is", null)
      .limit(500);

    // Fetch store profiles
    const { data: stores } = await supabase
      .from("profiles")
      .select("slug, updated_at")
      .eq("role", "store")
      .eq("is_active", true)
      .not("slug", "is", null)
      .limit(500);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const p of staticPages) {
      xml += `  <url><loc>${BASE}${p.loc}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`;
    }

    for (const post of posts || []) {
      const slug = post.slug || post.id;
      xml += `  <url><loc>${BASE}/post/${slug}</loc><lastmod>${post.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    for (const mesa of mesas || []) {
      const id = mesa.slug || mesa.id;
      xml += `  <url><loc>${BASE}/mesa/${id}</loc><lastmod>${mesa.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    }

    for (const gm of gms || []) {
      xml += `  <url><loc>${BASE}/mestre/${gm.slug}</loc><lastmod>${gm.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    }

    for (const store of stores || []) {
      xml += `  <url><loc>${BASE}/loja/${store.slug}</loc><lastmod>${store.updated_at?.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    console.error("sitemap error:", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
});
