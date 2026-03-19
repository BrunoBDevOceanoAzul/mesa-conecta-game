import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface MaterialItem {
  type: "note" | "link" | "file" | "checklist";
  title: string;
  content?: string;
  url?: string;
  file_url?: string;
  required?: boolean;
}

export interface PreparationFlow {
  id: string;
  game_table_id: string;
  system_template_id: string | null;
  title: string;
  description: string | null;
  form_template_id: string | null;
  materials_json: MaterialItem[];
  share_link: string | null;
  is_active: boolean;
  deadline_at: string | null;
}

export interface SystemTemplate {
  id: string;
  system_name: string;
  slug: string;
  description: string | null;
  default_character_form_json: FormSection[];
  default_materials_json: MaterialItem[];
}

// Fetch system template by name
export function useSystemTemplate(systemName: string | null) {
  const [template, setTemplate] = useState<SystemTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!systemName) { setTemplate(null); return; }
    setLoading(true);
    supabase
      .from("rpg_system_templates")
      .select("*")
      .eq("system_name", systemName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTemplate({
            ...data,
            default_character_form_json: (data.default_character_form_json || []) as FormSection[],
            default_materials_json: (data.default_materials_json || []) as MaterialItem[],
          });
        } else {
          // Fallback: try generic
          supabase
            .from("rpg_system_templates")
            .select("*")
            .eq("slug", "sistema-proprio")
            .maybeSingle()
            .then(({ data: fallback }) => {
              setTemplate(fallback ? {
                ...fallback,
                default_character_form_json: (fallback.default_character_form_json || []) as FormSection[],
                default_materials_json: (fallback.default_materials_json || []) as MaterialItem[],
              } : null);
            });
        }
        setLoading(false);
      });
  }, [systemName]);

  return { template, loading };
}

// Fetch preparation flow for a table
export function usePreparationFlow(gameTableId: string | null) {
  const [flow, setFlow] = useState<PreparationFlow | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(() => {
    if (!gameTableId) return;
    setLoading(true);
    supabase
      .from("table_preparation_flows")
      .select("*")
      .eq("game_table_id", gameTableId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFlow({
            ...data,
            materials_json: (data.materials_json || []) as MaterialItem[],
          });
        }
        setLoading(false);
      });
  }, [gameTableId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { flow, loading, refetch };
}

// Player submissions for a table
export interface PlayerSubmission {
  id: string;
  user_id: string;
  status: string;
  answers_json: Record<string, any>;
  started_at: string | null;
  submitted_at: string | null;
  last_edited_at: string | null;
  player_name?: string;
}

export function usePlayerSubmissions(gameTableId: string | null) {
  const [submissions, setSubmissions] = useState<PlayerSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(() => {
    if (!gameTableId) return;
    setLoading(true);
    supabase
      .from("player_form_submissions")
      .select("*")
      .eq("game_table_id", gameTableId)
      .then(({ data }) => {
        setSubmissions((data || []) as PlayerSubmission[]);
        setLoading(false);
      });
  }, [gameTableId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { submissions, loading, refetch };
}

// Current player's submission for a table
export function useMySubmission(gameTableId: string | null) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<PlayerSubmission | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(() => {
    if (!gameTableId || !user) return;
    setLoading(true);
    supabase
      .from("player_form_submissions")
      .select("*")
      .eq("game_table_id", gameTableId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubmission(data as PlayerSubmission | null);
        setLoading(false);
      });
  }, [gameTableId, user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { submission, loading, refetch };
}
