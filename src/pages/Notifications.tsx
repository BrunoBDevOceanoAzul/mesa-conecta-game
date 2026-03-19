import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Filter, Calendar, CreditCard, MessageCircle, Star, Zap, Megaphone, Gift, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navbar } from "@/components/landing/Navbar";

const typeConfig: Record<string, { icon: typeof Bell; label: string; className: string }> = {
  booking: { icon: Calendar, label: "Reserva", className: "text-primary" },
  payment: { icon: CreditCard, label: "Pagamento", className: "text-success" },
  payment_failed: { icon: AlertTriangle, label: "Pagamento", className: "text-destructive" },
  comment: { icon: MessageCircle, label: "Comentário", className: "text-info" },
  review: { icon: Star, label: "Avaliação", className: "text-secondary" },
  boost: { icon: Zap, label: "Destaque", className: "text-secondary" },
  founder: { icon: Gift, label: "Founder", className: "text-secondary" },
  institutional: { icon: Megaphone, label: "HIVIUM", className: "text-primary" },
  plan: { icon: CreditCard, label: "Plano", className: "text-warning" },
  default: { icon: Info, label: "Geral", className: "text-muted-foreground" },
};

function getConfig(type: string) {
  return typeConfig[type] ?? typeConfig.default;
}

const FILTER_TABS = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "booking", label: "Reservas" },
  { key: "payment", label: "Pagamentos" },
  { key: "comment", label: "Comentários" },
  { key: "boost", label: "Destaques" },
  { key: "institutional", label: "HIVIUM" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("all");

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.notification_type === filter;
  });

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Notificações</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? "não lida" : "não lidas"}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              {filter === "unread" ? (
                <Check className="h-6 w-6 text-success" />
              ) : (
                <Bell className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              {filter === "unread" ? "Você está em dia" : "Nenhuma notificação"}
            </p>
            <p className="text-xs text-muted-foreground">
              {filter === "unread"
                ? "Todas as notificações foram lidas"
                : "Nenhuma novidade por enquanto"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((n) => {
              const cfg = getConfig(n.notification_type);
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover",
                    !n.is_read && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted", cfg.className)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !n.is_read ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {cfg.label}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.is_read && <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
