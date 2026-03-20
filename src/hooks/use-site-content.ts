import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteContent {
  id: string;
  section_key: string;
  content_key: string;
  content_value: string;
  content_type: string;
  metadata_json: Record<string, any> | null;
}

// Cache to avoid re-fetching on every component mount
const contentCache = new Map<string, SiteContent[]>();

export function useSiteContent(sectionKey: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    const cached = contentCache.get(sectionKey);
    if (cached) {
      const map: Record<string, string> = {};
      cached.forEach((c) => { map[c.content_key] = c.content_value; });
      setContent(map);
      setLoading(false);
      return;
    }

    supabase
      .from("site_content")
      .select("*")
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const items = (data || []) as SiteContent[];
        contentCache.set(sectionKey, items);
        const map: Record<string, string> = {};
        items.forEach((c) => { map[c.content_key] = c.content_value; });
        setContent(map);
        setLoading(false);
      });
  }, [sectionKey]);

  /** Get content value or fallback to default */
  const get = (key: string, fallback: string = "") => content[key] || fallback;

  return { content, get, loading };
}

/** Invalidate cache for a section (call after admin edits) */
export function invalidateContentCache(sectionKey?: string) {
  if (sectionKey) {
    contentCache.delete(sectionKey);
  } else {
    contentCache.clear();
  }
}
