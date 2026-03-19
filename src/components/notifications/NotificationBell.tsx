import { Bell, Check, CheckCheck, CreditCard, Calendar, MessageCircle, Star, Zap, Megaphone, Gift, AlertTriangle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  booking: { icon: Calendar, className: "text-primary" },
  payment: { icon: CreditCard, className: "text-success" },
  payment_failed: { icon: AlertTriangle, className: "text-destructive" },
  comment: { icon: MessageCircle, className: "text-info" },
  review: { icon: Star, className: "text-secondary" },
  boost: { icon: Zap, className: "text-secondary" },
  founder: { icon: Gift, className: "text-secondary" },
  institutional: { icon: Megaphone, className: "text-primary" },
  plan: { icon: CreditCard, className: "text-warning" },
  default: { icon: Info, className: "text-muted-foreground" },
};

function getConfig(type: string) {
  return typeConfig[type] ?? typeConfig.default;
}

function NotificationItem({ n, onRead }: { n: AppNotification; onRead: (id: string, url?: string | null) => void }) {
  const cfg = getConfig(n.notification_type);
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => onRead(n.id, n.action_url)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover",
        !n.is_read && "bg-primary/5 border-l-2 border-primary"
      )}
    >
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted", cfg.className)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", !n.is_read ? "font-medium text-foreground" : "text-muted-foreground")}>
          {n.title}
        </p>
        {n.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 8);

  const handleRead = async (id: string, url?: string | null) => {
    await markAsRead(id);
    setOpen(false);
    if (url) navigate(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 border-border bg-card" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Check className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">Você está em dia</p>
              <p className="text-xs text-muted-foreground">Nenhuma novidade por enquanto</p>
            </div>
          ) : (
            recent.map((n) => <NotificationItem key={n.id} n={n} onRead={handleRead} />)
          )}
        </div>

        {/* Footer */}
        {recent.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setOpen(false); navigate("/notificacoes"); }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
