import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CharacterSheet {
  id: string;
  user_id: string;
  system_name: string;
  character_name: string;
  player_name: string;
  portrait_url: string | null;
  answers_json: Record<string, any>;
  computed_json: Record<string, any>;
  notes: string;
  status: string;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export function useCharacterSheets(systemName = "epico") {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSheets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("character_sheets")
      .select("*")
      .eq("user_id", user.id)
      .eq("system_name", systemName)
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    setSheets((data as unknown as CharacterSheet[]) || []);
    setLoading(false);
  }, [user, systemName]);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const createSheet = async (characterName: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("character_sheets")
      .insert({
        user_id: user.id,
        system_name: systemName,
        character_name: characterName,
        player_name: user.user_metadata?.name || "",
      } as any)
      .select()
      .single();
    if (error) { toast({ title: "Erro ao criar ficha", variant: "destructive" }); return null; }
    await fetchSheets();
    return data as unknown as CharacterSheet;
  };

  const deleteSheet = async (id: string) => {
    await supabase.from("character_sheets").update({ status: "deleted" } as any).eq("id", id);
    await fetchSheets();
    toast({ title: "Personagem excluído" });
  };

  return { sheets, loading, createSheet, deleteSheet, refetch: fetchSheets };
}

export function useCharacterSheet(sheetId: string | undefined) {
  const [sheet, setSheet] = useState<CharacterSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchSheet = useCallback(async () => {
    if (!sheetId) return;
    setLoading(true);
    const { data } = await supabase
      .from("character_sheets")
      .select("*")
      .eq("id", sheetId)
      .single();
    setSheet(data as unknown as CharacterSheet);
    setLoading(false);
  }, [sheetId]);

  useEffect(() => { fetchSheet(); }, [fetchSheet]);

  const saveSheet = useCallback(async (updates: Partial<CharacterSheet>) => {
    if (!sheetId) return;
    await supabase
      .from("character_sheets")
      .update({
        ...updates,
        last_saved_at: new Date().toISOString(),
      } as any)
      .eq("id", sheetId);
  }, [sheetId]);

  const autosave = useCallback((updates: Partial<CharacterSheet>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveSheet(updates), 2000);
  }, [saveSheet]);

  const uploadPortrait = useCallback(async (file: File) => {
    if (!sheetId) return;
    const ext = file.name.split(".").pop();
    const path = `portraits/${sheetId}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await saveSheet({ portrait_url: urlData.publicUrl } as any);
    setSheet(prev => prev ? { ...prev, portrait_url: urlData.publicUrl } : prev);
    toast({ title: "Retrato atualizado! 🎨" });
  }, [sheetId, saveSheet]);

  return { sheet, setSheet, loading, saveSheet, autosave, uploadPortrait };
}
