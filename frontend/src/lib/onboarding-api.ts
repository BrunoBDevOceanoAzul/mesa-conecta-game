import { supabase } from "@/integrations/supabase/client";

/**
 * Persistência do onboarding MesaQuest no Supabase
 * Todas as funções usam o usuário autenticado atual
 */

export interface OnboardingData {
  // Step 1 - Basic Info
  name: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  dataDeclarationAccepted: boolean;
  bio: string;
  phoneNumber: string;
  favoriteFormat: string;
  experienceLevel: string;
  userTagIds: string[];

  // Step 2 - Preferences
  rpgSystems: string[];
  tags: string[];
  languages: string[];
  platforms: string[];
  availableDays: string[];

  // Step 3 - Photo
  avatarUrl: string;
}

export async function saveOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuário não autenticado" };

    const profileData: Record<string, unknown> = {
      name: data.name || null,
      full_name: data.fullName || null,
      birth_date: data.birthDate || null,
      cpf: data.cpf || null,
      data_declaration_accepted: data.dataDeclarationAccepted || false,
      bio: data.bio || null,
      phone_number: data.phoneNumber || null,
      favorite_format: data.favoriteFormat || null,
      experience_level: data.experienceLevel || null,
      user_tag_ids: data.userTagIds || [],
      rpg_systems: data.rpgSystems || [],
      tags: data.tags || [],
      languages: data.languages || [],
      platforms: data.platforms || [],
      available_days: data.availableDays || [],
      avatar_url: data.avatarUrl || null,
      onboarding_completed: true,
      onboarding_step: 3,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, ...profileData }, { onConflict: "user_id" });

    if (error) {
      console.error("[Onboarding] Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Onboarding] Unexpected error:", err);
    return { success: false, error: err.message || "Erro desconhecido" };
  }
}

export async function loadExistingOnboarding(): Promise<Partial<OnboardingData> | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;

    return {
      name: data.name || "",
      fullName: data.full_name || "",
      birthDate: data.birth_date || "",
      cpf: data.cpf || "",
      dataDeclarationAccepted: data.data_declaration_accepted || false,
      bio: data.bio || "",
      phoneNumber: data.phone_number || "",
      favoriteFormat: data.favorite_format || "",
      experienceLevel: data.experience_level || "",
      userTagIds: data.user_tag_ids || [],
      rpgSystems: data.rpg_systems || [],
      tags: data.tags || [],
      languages: data.languages || [],
      platforms: data.platforms || [],
      availableDays: data.available_days || [],
      avatarUrl: data.avatar_url || "",
    };
  } catch {
    return null;
  }
}
