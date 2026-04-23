import { supabase } from "@/integrations/supabase/client";

// Usa URL absoluta quando definida (dev), ou caminho relativo quando no mesmo servidor (produção)
const API_BASE_URL = import.meta.env.VITE_MESA_API_URL || "";

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
 * Health check da API
 */
export const healthApi = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
