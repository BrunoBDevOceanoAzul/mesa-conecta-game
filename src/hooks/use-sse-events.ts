import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_MESA_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "/api");

type SseEventHandler = (data: unknown) => void;

interface SseEventMap {
  "booking:confirmed": SseEventHandler;
  "booking:canceled": SseEventHandler;
  "payment:received": SseEventHandler;
  "mesa:updated": SseEventHandler;
}

/**
 * Hook para conexão SSE com a API Mesa
 * Reconecta automaticamente em caso de erro
 */
export function useSseEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<string, Set<SseEventHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const on = useCallback(<K extends keyof SseEventMap>(
    event: K,
    handler: SseEventMap[K]
  ) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function connect() {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      // EventSource não suporta headers customizados.
      // Usamos query parameter para o token (única opção nativa).
      const es = new EventSource(
        `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`
      );

      es.onopen = () => {
        console.log("[SSE] Connected");
      };

      es.addEventListener("connected", (e) => {
        console.log("[SSE] Server says:", e.data);
      });

      es.addEventListener("booking:confirmed", (e) => {
        const data = JSON.parse(e.data);
        handlersRef.current.get("booking:confirmed")?.forEach((h) => h(data));
      });

      es.addEventListener("booking:canceled", (e) => {
        const data = JSON.parse(e.data);
        handlersRef.current.get("booking:canceled")?.forEach((h) => h(data));
      });

      es.addEventListener("payment:received", (e) => {
        const data = JSON.parse(e.data);
        handlersRef.current.get("payment:received")?.forEach((h) => h(data));
      });

      es.addEventListener("mesa:updated", (e) => {
        const data = JSON.parse(e.data);
        handlersRef.current.get("mesa:updated")?.forEach((h) => h(data));
      });

      es.onerror = () => {
        console.log("[SSE] Error, reconnecting...");
        es.close();
        if (isActive) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };

      eventSourceRef.current = es;
    }

    connect();

    return () => {
      isActive = false;
      clearTimeout(reconnectTimeoutRef.current);
      eventSourceRef.current?.close();
    };
  }, []);

  return { on };
}
