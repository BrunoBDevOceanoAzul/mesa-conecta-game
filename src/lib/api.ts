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
 * Mapper: converte resposta camelCase da API para snake_case do frontend
 */
function mapMesaFromApi(m: Record<string, unknown>): Record<string, unknown> {
  return {
    id: m.id,
    title: m.title,
    description: m.description ?? null,
    system: m.system,
    session_type: m.sessionType ?? m.session_type ?? null,
    format: m.format,
    city: m.city ?? null,
    venue: m.venue ?? null,
    min_price: m.minPrice ?? m.min_price ?? 0,
    max_price: m.maxPrice ?? m.max_price ?? 0,
    seats_total: m.seatsTotal ?? m.seats_total ?? 0,
    seats_available: m.seatsAvailable ?? m.seats_available ?? 0,
    gm_id: m.gmId ?? m.gm_id ?? null,
    gm_name: m.gmName ?? m.gm_name ?? null,
    start_at: m.startAt ?? m.start_at ?? null,
    end_at: m.endAt ?? m.end_at ?? null,
    status: m.status,
    tags: m.tags ?? null,
    play_styles: m.playStyles ?? m.play_styles ?? null,
    image_url: m.imageUrl ?? m.image_url ?? null,
    cover_image_url: m.coverImageUrl ?? m.cover_image_url ?? null,
    mesa_type: m.mesaType ?? m.mesa_type ?? null,
    board_game_id: m.boardGameId ?? m.board_game_id ?? null,
    store_id: m.storeId ?? m.store_id ?? null,
    store_slot_id: m.storeSlotId ?? m.store_slot_id ?? null,
    organizer_name: m.organizerName ?? m.organizer_name ?? null,
    created_at: m.createdAt ?? m.created_at ?? null,
    updated_at: m.updatedAt ?? m.updated_at ?? null,
  };
}

/**
 * Mesas — CRUD e discovery
 */
export const mesasApi = {
  /**
   * Lista mesas com filtros
   */
  list: async (params?: {
    city?: string;
    system?: string;
    format?: "presencial" | "online" | "hibrido";
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.set("city", params.city);
    if (params?.system) queryParams.set("system", params.system);
    if (params?.format) queryParams.set("format", params.format);
    if (params?.minPrice !== undefined) queryParams.set("minPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined) queryParams.set("maxPrice", String(params.maxPrice));
    if (params?.startDate) queryParams.set("startDate", params.startDate);
    if (params?.endDate) queryParams.set("endDate", params.endDate);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.lat !== undefined) queryParams.set("lat", String(params.lat));
    if (params?.lng !== undefined) queryParams.set("lng", String(params.lng));
    if (params?.radiusKm !== undefined) queryParams.set("radiusKm", String(params.radiusKm));
    if (params?.limit !== undefined) queryParams.set("limit", String(params.limit));
    if (params?.offset !== undefined) queryParams.set("offset", String(params.offset));

    const result = await fetchWithAuth(`/mesas?${queryParams.toString()}`);
    if (Array.isArray(result.data)) {
      result.data = result.data.map(mapMesaFromApi);
    }
    return result;
  },

  /**
   * Busca detalhe da mesa por ID
   */
  getById: async (id: string) => {
    const result = await fetchWithAuth(`/mesas/${id}`);
    if (result.data) {
      result.data = mapMesaFromApi(result.data as Record<string, unknown>);
    }
    return result;
  },

  /**
   * Cria uma nova mesa
   */
  create: async (mesa: {
    title: string;
    description?: string;
    system: string;
    format?: "presencial" | "online" | "hibrido";
    sessionType?: "oneshot" | "campanha" | "aventura" | "modulo";
    mesaType?: string;
    status?: "aberta" | "lotada" | "encerrada" | "cancelada";
    gmId: string;
    gmName: string;
    storeId?: string;
    storeSlotId?: string;
    boardGameId?: string;
    address?: string;
    city?: string;
    venue?: string;
    lat?: number;
    lng?: number;
    startAt: string;
    endAt?: string;
    seatsTotal?: number;
    seatsAvailable?: number;
    minPrice?: string;
    maxPrice?: string;
    playStyles?: string[];
    tags?: string[];
    imageUrl?: string;
    coverImageUrl?: string;
    organizerName?: string;
  }) => {
    return fetchWithAuth("/mesas", {
      method: "POST",
      body: JSON.stringify(mesa),
    });
  },
};

/**
 * Bookings — Reservas
 */
export const bookingsApi = {
  /**
   * Cria uma reserva
   */
  create: async (booking: {
    gameTableId: string;
    tableSessionId?: string;
    seatsReserved?: number;
    amount?: string;
    currency?: string;
    sourceType?: "organic" | "referral" | "campaign" | "boost";
  }) => {
    return fetchWithAuth("/bookings", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  },

  /**
   * Lista minhas reservas
   */
  listMine: async () => {
    return fetchWithAuth("/bookings/me");
  },

  /**
   * Cancela uma reserva
   */
  cancel: async (id: string) => {
    return fetchWithAuth(`/bookings/${id}/cancel`, {
      method: "PATCH",
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
