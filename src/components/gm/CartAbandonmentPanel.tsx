import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, RefreshCw, Mail, Clock, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CartAbandonment {
  id: string;
  player_user_id: string;
  player_email: string | null;
  player_name: string | null;
  mesa_id: string;
  mesa_title: string | null;
  amount_cents: number;
  status: string;
  abandoned_at: string;
  recovered_at: string | null;
  remarketing_sent_at: string | null;
  remarketing_channel: string | null;
  created_at: string;
}

export function CartAbandonmentPanel() {
  const { user } = useAuth();
  const [abandonments, setAbandonments] = useState<CartAbandonment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("cart_abandonments")
      .select("*")
      .eq("gm_user_id", user.id)
      .order("abandoned_at", { ascending: false })
      .limit(100);
    setAbandonments((data as CartAbandonment[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const abandoned = abandonments.filter(a => a.status === "abandoned");
  const recovered = abandonments.filter(a => a.status === "recovered");
  const total = abandonments.length;
  const recoveryRate = total > 0 ? Math.round((recovered.length / total) * 100) : 0;
  const lostRevenue = abandoned.reduce((s, a) => s + (a.amount_cents || 0), 0);

  const markRemarketingSent = async (id: string, channel: string) => {
    await supabase.from("cart_abandonments").update({
      remarketing_sent_at: new Date().toISOString(),
      remarketing_channel: channel,
    }).eq("id", id);
    toast.success("Remarketing registrado!");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" /> Abandono de Carrinho
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Jogadores que iniciaram checkout mas não finalizaram.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Abandonos" value={String(total)} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Pendentes" value={String(abandoned.length)} accent />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Recuperados" value={`${recovered.length} (${recoveryRate}%)`} />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Receita Perdida" value={`R$${(lostRevenue / 100).toFixed(0)}`} accent />
      </div>

      {/* Abandonment list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : abandoned.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-10 w-10" />}
          title="Nenhum abandono pendente"
          description="Todos os checkouts foram concluídos ou ainda não houve tentativas."
        />
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Abandonos pendentes de remarketing</h3>
          {abandoned.map(a => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {a.player_name || "Jogador anônimo"}
                  </span>
                  {a.remarketing_sent_at && (
                    <Badge variant="secondary" className="text-[10px]">
                      Remarketing enviado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.mesa_title} · R${((a.amount_cents || 0) / 100).toFixed(2).replace(".", ",")}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(a.abandoned_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  {a.player_email && (
                    <span className="truncate">{a.player_email}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!a.remarketing_sent_at ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => {
                        if (a.player_email) {
                          window.open(`mailto:${a.player_email}?subject=Sua vaga ainda está disponível!&body=Oi ${a.player_name || ""}! Notamos que você não concluiu a reserva para "${a.mesa_title}". A vaga ainda está disponível!`);
                          markRemarketingSent(a.id, "email");
                        } else {
                          toast.error("Jogador sem email registrado");
                        }
                      }}
                    >
                      <Mail className="h-3 w-3" /> Email
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs gap-1"
                      onClick={() => {
                        const msg = encodeURIComponent(`Oi ${a.player_name || ""}! 🎲 Notei que você não finalizou sua reserva para "${a.mesa_title}". A vaga ainda está disponível! Quer garantir seu lugar?`);
                        window.open(`https://wa.me/?text=${msg}`);
                        markRemarketingSent(a.id, "whatsapp");
                      }}
                    >
                      WhatsApp
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Enviado via {a.remarketing_channel} · {formatDistanceToNow(new Date(a.remarketing_sent_at), { addSuffix: true, locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recovered list */}
      {recovered.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Recuperados recentes
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recovered.slice(0, 6).map(a => (
              <div key={a.id} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{a.player_name || "Jogador"}</p>
                <p className="text-xs text-muted-foreground">{a.mesa_title}</p>
                <p className="text-xs text-green-500 font-medium">
                  R${((a.amount_cents || 0) / 100).toFixed(2).replace(".", ",")} recuperado
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
