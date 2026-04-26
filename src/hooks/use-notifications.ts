import { useEffect, useState, useCallback } from "react";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface AppNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapApiNotification(apiNotification: any): AppNotification {
  return {
    id: apiNotification.id,
    user_id: apiNotification.userId,
    notification_type: apiNotification.type,
    title: apiNotification.title ?? "",
    body: apiNotification.body ?? null,
    action_url: apiNotification.dataJson?.actionUrl ?? null,
    is_read: apiNotification.isRead ?? false,
    read_at: apiNotification.readAt ?? null,
    created_at: apiNotification.createdAt,
    updated_at: apiNotification.createdAt,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await notificationsApi.list({ limit: 50 });
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setNotifications(data.data.map(mapApiNotification));
      } else {
        setError(data.error || "Falha ao carregar notificações");
        setNotifications([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationsApi.markAsRead(id);
      const data = await response.json();
      if (data.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
      return data;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const response = await notificationsApi.markAllAsRead();
      const data = await response.json();
      if (data.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
      }
      return data;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
