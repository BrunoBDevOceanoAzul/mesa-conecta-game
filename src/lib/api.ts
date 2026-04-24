import { supabase } from "@/integrations/supabase/client";

// Em dev local o backend roda em localhost; em deploy integrado usamos /api.
const API_BASE_URL = import.meta.env.VITE_MESA_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "/api");

/**
 * Cliente HTTP para a API Mesa
 * Todas as requisições incluem o token do Supabase automaticamente
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Eventos - Rastreamento comportamental
 */
export const eventsApi = {
  /**
   * Registra um evento de interação do usuário
   */
  track: async (event: {
    eventType: string;
    mesaId?: string;
    gmId?: string;
    payload?: Record<string, unknown>;
    source?: string;
    sessionId?: string;
  }) => {
    return fetchWithAuth("/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },

  /**
   * Eventos pré-definidos para facilitar instrumentação
   */
  mesaClick: (mesaId: string, position: number, listType: string = "recommendations") =>
    eventsApi.track({
      eventType: "mesa_click",
      mesaId,
      payload: { position, listType },
      source: listType,
    }),

  mesaFavorite: (mesaId: string, action: "add" | "remove") =>
    eventsApi.track({
      eventType: "mesa_favorite",
      mesaId,
      payload: { action },
    }),

  pageView: (mesaId: string, source: string = "direct") =>
    eventsApi.track({
      eventType: "page_view",
      mesaId,
      source,
    }),

  bookingInitiated: (mesaId: string) =>
    eventsApi.track({
      eventType: "booking_initiated",
      mesaId,
    }),

  bookingConfirmed: (mesaId: string, bookingId: string) =>
    eventsApi.track({
      eventType: "booking_confirmed",
      mesaId,
      payload: { bookingId },
    }),

  searchQuery: (query: string, filters?: Record<string, unknown>) =>
    eventsApi.track({
      eventType: "search_query",
      payload: { query, filters },
    }),
};

/**
 * Recomendações - Algoritmo de matching
 */
export const recommendationsApi = {
  /**
   * Busca mesas recomendadas para o usuário
   */
  getMesas: async (params?: {
    lat?: number;
    lng?: number;
    limit?: number;
    offset?: number;
    city?: string;
    system?: string;
    format?: "presencial" | "online" | "hibrido";
    maxPrice?: number;
    minSeats?: number;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.lat) queryParams.set("lat", String(params.lat));
    if (params?.lng) queryParams.set("lng", String(params.lng));
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));
    if (params?.city) queryParams.set("city", params.city);
    if (params?.system) queryParams.set("system", params.system);
    if (params?.format) queryParams.set("format", params.format);
    if (params?.maxPrice) queryParams.set("maxPrice", String(params.maxPrice));
    if (params?.minSeats) queryParams.set("minSeats", String(params.minSeats));

    return fetchWithAuth(`/mesas/recomendadas?${queryParams.toString()}`);
  },
};

/**
 * Perfil — GET /auth/me e PUT /profiles/me
 */
export const profilesApi = {
  /**
   * Busca perfil completo do usuário autenticado
   */
  getMe: async () => {
    const result = await fetchWithAuth("/auth/me");
    // Normaliza camelCase da API para snake_case do frontend
    const d = result.data;
    return {
      display_name: d.displayName || "",
      bio: d.bio || "",
      avatar_url: d.avatarUrl || "",
      instagram_handle: d.instagramHandle || "",
      city: d.city || "",
      whatsapp: d.whatsapp || "",
      role: d.role || "",
      can_play: d.capabilities?.canPlay ?? false,
      can_gm: d.capabilities?.canGm ?? false,
      can_manage_store: d.capabilities?.canManageStore ?? false,
      can_manage_brand: d.capabilities?.canManageBrand ?? false,
      preferred_systems: d.preferences?.preferredSystems || [],
      play_styles: d.preferences?.playStyles || [],
      preferred_format: d.preferences?.preferredFormat || "",
      experience_level: d.preferences?.experienceLevel || "",
    };
  },

  /**
   * Atualiza perfil do usuário autenticado
   */
  updateMe: async (profile: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    instagram_handle?: string;
    city?: string;
    whatsapp?: string;
    role?: string;
    can_play?: boolean;
    can_gm?: boolean;
    can_manage_store?: boolean;
    can_manage_brand?: boolean;
    preferred_systems?: string[];
    play_styles?: string[];
    preferred_format?: string;
    experience_level?: string;
  }) => {
    // Mapeia snake_case do frontend para camelCase da API
    const body: Record<string, unknown> = {};
    if (profile.display_name !== undefined) body.displayName = profile.display_name;
    if (profile.bio !== undefined) body.bio = profile.bio;
    if (profile.avatar_url !== undefined) body.avatarUrl = profile.avatar_url;
    if (profile.instagram_handle !== undefined) body.instagramHandle = profile.instagram_handle;
    if (profile.city !== undefined) body.city = profile.city;
    if (profile.whatsapp !== undefined) body.whatsapp = profile.whatsapp;
    if (profile.role !== undefined) body.role = profile.role;
    if (profile.can_play !== undefined) body.canPlay = profile.can_play;
    if (profile.can_gm !== undefined) body.canGm = profile.can_gm;
    if (profile.can_manage_store !== undefined) body.canManageStore = profile.can_manage_store;
    if (profile.can_manage_brand !== undefined) body.canManageBrand = profile.can_manage_brand;
    if (profile.preferred_systems !== undefined) body.preferredSystems = profile.preferred_systems;
    if (profile.play_styles !== undefined) body.playStyles = profile.play_styles;
    if (profile.preferred_format !== undefined) body.preferredFormat = profile.preferred_format;
    if (profile.experience_level !== undefined) body.experienceLevel = profile.experience_level;

    return fetchWithAuth("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};

/**
 * Health check da API
 */
export const healthApi = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
