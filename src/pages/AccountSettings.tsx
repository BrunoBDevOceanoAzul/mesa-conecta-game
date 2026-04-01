import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock, Bell, Trash2, Loader2, User, Shield, CreditCard, Crown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

interface SubInfo {
  plan_name: string | null;
  status: string;
  current_period_end: string | null;
  billing_product_id: string | null;
}

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [profileRole, setProfileRole] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_name, status, current_period_end, billing_product_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([subRes, profRes]) => {
      if (subRes.data) setSubscription(subRes.data);
      if (profRes.data) setProfileRole(profRes.data.role || "");
      setLoadingSub(false);
    });
  }, [user]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Senha atualizada!"); setNewPassword(""); }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== "EXCLUIR") { toast.error("Digite EXCLUIR para confirmar."); return; }
    setDeleting(true);
    if (user) {
      await supabase.from("profiles").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("user_id", user.id);
    }
    await signOut();
    toast.success("Conta excluída. Sentiremos sua falta.");
    navigate("/");
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: "Ativo", canceled: "Cancelado", past_due: "Pagamento pendente", trialing: "Período de teste" };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (s === "past_due") return "bg-amber-500/10 text-amber-600 border-amber-200";
    return "bg-muted text-muted-foreground";
  };

  const navItems = [
    { label: "Meu Perfil", path: "/perfil", icon: <User className="h-4 w-4" /> },
    { label: "Configurações", path: "/configuracoes", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Usuário"}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-h2 text-foreground flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta, assinatura e preferências</p>
        </div>

        {/* Email & Account */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Conta</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Email</label>
              <p className="text-sm text-foreground mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="field-label">Perfil principal</label>
              <p className="text-sm text-foreground mt-1 capitalize">{profileRole || "Não definido"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60">Para alterar seu email, entre em contato com o suporte.</p>
        </section>

        {/* Subscription */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Assinatura</h2>
          {loadingSub ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{subscription.plan_name || "Plano ativo"}</span>
                <Badge variant="outline" className={statusColor(subscription.status)}>
                  {statusLabel(subscription.status)}
                </Badge>
              </div>
              {subscription.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Próxima renovação: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/billing")}>
                  <CreditCard className="h-3.5 w-3.5" /> Gerenciar Assinatura
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Você não possui uma assinatura ativa.</p>
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/precos")}>
                <Crown className="h-3.5 w-3.5" /> Ver Planos
              </Button>
            </div>
          )}
        </section>

        {/* Password */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Alterar Senha</h2>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (min 6 caracteres)" />
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" className="gap-1.5">
            {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Alterar Senha
          </Button>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notificações</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Notificações por email</p>
              <p className="text-xs text-muted-foreground">Receba novidades e avisos de reservas</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Emails de marketing</p>
              <p className="text-xs text-muted-foreground">Dicas, promoções e novidades</p>
            </div>
            <Switch />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Zona de Perigo</h2>
          <p className="text-xs text-muted-foreground">Esta ação é irreversível. Todos os seus dados serão excluídos.</p>
          <Input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder='Digite "EXCLUIR" para confirmar' />
          <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting || confirmDelete !== "EXCLUIR"} className="gap-1.5">
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Excluir Minha Conta
          </Button>
        </section>
      </div>
    </DashboardLayout>
  );
}
