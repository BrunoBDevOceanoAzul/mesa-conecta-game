import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Lock, Bell, Trash2, Loader2, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

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
    // Mark profile as deleted
    if (user) {
      await supabase.from("profiles").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("user_id", user.id);
    }
    await signOut();
    toast.success("Conta excluída. Sentiremos sua falta.");
    navigate("/");
  };

  const navItems = [
    { label: "Meu Perfil", path: "/perfil", icon: <User className="h-4 w-4" /> },
    { label: "Configurações", path: "/configuracoes", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Usuário"}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-h2 text-foreground flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
        </div>

        {/* Email */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Email</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground/60">Para alterar seu email, entre em contato com o suporte.</p>
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
