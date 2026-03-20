import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteImage {
  id: string;
  section_key: string;
  title: string | null;
  alt_text: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useSiteImages(sectionKey: string) {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_images")
      .select("*")
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setImages((data || []) as SiteImage[]);
        setLoading(false);
      });
  }, [sectionKey]);

  return { images, loading };
}
