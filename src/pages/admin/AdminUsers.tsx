import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Users, Search, Eye, Shield, Crown, Store, Gamepad2,
  CheckCircle2, XCircle, Mail, MapPin, Calendar, CreditCard, Star,
  Trophy, DollarSign, Loader2, Pencil, Tag, Save, Percent,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

/* ─── Types ─── */
interface UserRow {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  can_play: boolean;
  can_gm: boolean;
  city: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  sub_status: string | null;
  plan_name: string | null;
  plan_role: string | null;
  is_founder: boolean;
  xp: number;
  badge_count: number;
  // Discount
  discount_active: boolean;
  discount_type: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  discount_ends_at: string | null;
  discount_source: string | null;
}

interface DiscountFormData {
  discount_type: string;
  percent_off: string;
  amount_off: string;
  duration_type: string;
  duration_in_months: string;
  starts_at: string;
  ends_at: string;
  applies_to_role: string;
  source_type: string;
  notes: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  player: { label: "Jogador", icon: <Gamepad2 className="h-3 w-3" />, cls: "bg-info/10 text-info border-info/20" },
  gm: { label: "Mestre", icon: <Crown className="h-3 w-3" />, cls: "bg-secondary/10 text-secondary border-secondary/20" },
  store: { label: "Luderia", icon: <Store className="h-3 w-3" />, cls: "bg-accent/10 text-accent border-accent/20" },
  brand: { label: "Marca", icon: <Star className="h-3 w-3" />, cls: "bg-primary/10 text-primary border-primary/20" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ROLE_LABELS: Record<string, string> = {
  player: "Jogador",
  gm: "Mestre",
  store: "Loja / Luderia",
  brand: "Marca",
};

const defaultDiscount: DiscountFormData = {
  discount_type: "percent",
  percent_off: "",
  amount_off: "",
  duration_type: "repeating",
  duration_in_months: "3",
  starts_at: new Date().toISOString().split("T")[0],
  ends_at: "",
  applies_to_role: "",
  source_type: "admin",
  notes: "",
};

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<UserRow | null>(null);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [editCanPlay, setEditCanPlay] = useState(false);
  const [editCanGm, setEditCanGm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Discount dialog
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountForm, setDiscountForm] = useState<DiscountFormData>(defaultDiscount);
  const [discountSaving, setDiscountSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [profilesRes, subsRes, walletsRes, xpRes, badgesRes, discountsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email, role, can_play, can_gm, city, is_active, onboarding_completed, created_at"),
      supabase.from("subscriptions").select("user_id, status, plan_name, plan_role"),
      supabase.from("credit_wallets").select("user_id, is_founder"),
      supabase.from("master_xp_profiles").select("user_id, total_xp"),
      supabase.from("master_badges").select("user_id"),
      supabase.from("user_discounts").select("user_id, discount_type, percent_off, amount_off, ends_at, source_type, is_active").eq("is_active", true),
    ]);

    const profiles = profilesRes.data || [];
    const subs = subsRes.data || [];
    const wallets = walletsRes.data || [];
    const xps = xpRes.data || [];
    const badges = badgesRes.data || [];
    const discounts = (discountsRes.data || []) as any[];

    const rows: UserRow[] = profiles.map((p: any) => {
      const sub = subs.find((s: any) => s.user_id === p.user_id && (s.status === "active" || s.status === "trialing"));
      const wallet = wallets.find((w: any) => w.user_id === p.user_id);
      const xp = xps.find((x: any) => x.user_id === p.user_id);
      const badgeCount = badges.filter((b: any) => b.user_id === p.user_id).length;
      const disc = discounts.find((d: any) => d.user_id === p.user_id);

      return {
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        role: p.role,
        can_play: p.can_play ?? false,
        can_gm: p.can_gm ?? false,
        city: p.city,
        is_active: p.is_active ?? true,
        onboarding_completed: p.onboarding_completed ?? false,
        created_at: p.created_at,
        sub_status: sub?.status || null,
        plan_name: (sub as any)?.plan_name || null,
        plan_role: (sub as any)?.plan_role || null,
        is_founder: wallet?.is_founder || false,
        xp: (xp as any)?.total_xp || 0,
        badge_count: badgeCount,
        discount_active: !!disc,
        discount_type: disc?.discount_type || null,
        discount_percent: disc?.percent_off || null,
        discount_amount: disc?.amount_off || null,
        discount_ends_at: disc?.ends_at || null,
        discount_source: disc?.source_type || null,
      };
    });

    setUsers(rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (statusFilter === "onboarded" && !u.onboarding_completed) return false;
      if (statusFilter === "subscriber" && !u.sub_status) return false;
      if (statusFilter === "no_role" && u.role) return false;
      if (statusFilter === "discount" && !u.discount_active) return false;
      if (search) {
        const q = search.toLowerCase();
        return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  function openDetail(u: UserRow) {
    setSelected(u);
    setEditMode(false);
    setEditRole(u.role || "");
    setEditCanPlay(u.can_play);
    setEditCanGm(u.can_gm);
  }

  function startEdit() {
    if (!selected) return;
    setEditRole(selected.role || "");
    setEditCanPlay(selected.can_play);
    setEditCanGm(selected.can_gm);
    setEditMode(true);
  }

  async function saveProfile() {
    if (!selected || !adminUser) return;
    setSaving(true);

    const oldData = { role: selected.role, can_play: selected.can_play, can_gm: selected.can_gm };
    const newData = { role: editRole || null, can_play: editCanPlay, can_gm: editCanGm };

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({ role: editRole || null, can_play: editCanPlay, can_gm: editCanGm } as any)
      .eq("user_id", selected.user_id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_user_id: adminUser.id,
      action_type: "update_profile",
      target_id: selected.user_id,
      target_type: "user",
      notes: `Role: ${oldData.role} → ${newData.role}, can_play: ${oldData.can_play} → ${newData.can_play}, can_gm: ${oldData.can_gm} → ${newData.can_gm}`,
      payload_json: { old: oldData, new: newData },
    } as any);

    toast({ title: "Perfil atualizado", description: `${selected.name || selected.email} foi atualizado com sucesso.` });
    setSaving(false);
    setEditMode(false);
    setSelected(null);
    fetchUsers();
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from("profiles").update({ is_active: !currentlyActive }).eq("user_id", userId);

    if (adminUser) {
      await supabase.from("admin_actions").insert({
        admin_user_id: adminUser.id,
        action_type: currentlyActive ? "deactivate_user" : "reactivate_user",
        target_id: userId,
        target_type: "user",
      } as any);
    }

    toast({ title: currentlyActive ? "Conta desativada" : "Conta reativada" });
    fetchUsers();
    setSelected(null);
  }

  function openDiscountDialog() {
    if (!selected) return;
    setDiscountForm({
      ...defaultDiscount,
      applies_to_role: selected.role || "",
    });
    setDiscountOpen(true);
  }

  async function saveDiscount() {
    if (!selected || !adminUser) return;
    setDiscountSaving(true);

    const payload: Record<string, unknown> = {
      user_id: selected.user_id,
      discount_type: discountForm.discount_type,
      percent_off: discountForm.discount_type === "percent" ? parseFloat(discountForm.percent_off) || null : null,
      amount_off: discountForm.discount_type === "fixed" ? parseFloat(discountForm.amount_off) || null : null,
      duration_type: discountForm.duration_type,
      duration_in_months: discountForm.duration_type === "repeating" ? parseInt(discountForm.duration_in_months) || null : null,
      starts_at: discountForm.starts_at || new Date().toISOString(),
      ends_at: discountForm.ends_at || null,
      applies_to_role: discountForm.applies_to_role || null,
      source_type: discountForm.source_type,
      notes: discountForm.notes || null,
      is_active: true,
      created_by_admin_id: adminUser.id,
    };

    // Deactivate existing discounts for this user
    await supabase
      .from("user_discounts")
      .update({ is_active: false } as any)
      .eq("user_id", selected.user_id)
      .eq("is_active", true);

    const { error } = await supabase.from("user_discounts").insert(payload as any);

    if (error) {
      toast({ title: "Erro ao criar desconto", description: error.message, variant: "destructive" });
      setDiscountSaving(false);
      return;
    }

    // Log
    await supabase.from("admin_actions").insert({
      admin_user_id: adminUser.id,
      action_type: "apply_discount",
      target_id: selected.user_id,
      target_type: "user",
      payload_json: payload,
      notes: `Desconto ${discountForm.discount_type === "percent" ? discountForm.percent_off + "%" : "R$" + discountForm.amount_off} aplicado`,
    } as any);

    toast({ title: "Desconto aplicado", description: `Desconto criado para ${selected.name || selected.email}.` });
    setDiscountSaving(false);
    setDiscountOpen(false);
    setSelected(null);
    fetchUsers();
  }

  async function removeDiscount(userId: string) {
    await supabase
      .from("user_discounts")
      .update({ is_active: false } as any)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (adminUser) {
      await supabase.from("admin_actions").insert({
        admin_user_id: adminUser.id,
        action_type: "remove_discount",
        target_id: userId,
        target_type: "user",
      } as any);
    }

    toast({ title: "Desconto removido" });
    setSelected(null);
    fetchUsers();
  }

  const noRoleCount = users.filter(u => !u.role).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {users.length} usuários cadastrados.
            {noRoleCount > 0 && (
              <span className="text-warning ml-2">⚠️ {noRoleCount} sem perfil definido</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os perfis</option>
            <option value="player">Jogadores</option>
            <option value="gm">Mestres</option>
            <option value="store">Lojas</option>
            <option value="brand">Marcas</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="onboarded">Onboarding completo</option>
            <option value="subscriber">Com assinatura</option>
            <option value="no_role">Sem perfil definido</option>
            <option value="discount">Com desconto ativo</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cidade</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Plano</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Desconto</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Cadastro</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum usuário encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filtered.slice(0, 100).map((u) => {
                      const rc = u.role ? (ROLE_CONFIG[u.role] || ROLE_CONFIG.player) : { label: "Sem perfil", icon: <XCircle className="h-3 w-3" />, cls: "bg-warning/10 text-warning border-warning/20" };
                      return (
                        <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground truncate max-w-[180px]">{u.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${rc.cls}`}>
                              {rc.icon} {rc.label}
                            </span>
                            {u.can_play && u.can_gm && (
                              <span className="ml-1 text-[9px] text-muted-foreground">Híbrido</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{u.city || "—"}</td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            {u.sub_status ? (
                              <Badge variant="default" className="text-[10px]">{u.plan_name || "Ativo"}</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Free</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            {u.discount_active ? (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Percent className="h-2.5 w-2.5" />
                                {u.discount_type === "percent" ? `${u.discount_percent}%` : `R$${u.discount_amount}`}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            {u.onboarding_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                            {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openDetail(u)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 100 && (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center border-t border-border bg-muted/20">
                Mostrando 100 de {filtered.length} resultados.
              </div>
            )}
          </div>
        )}

        {/* ─── Detail Sheet ─── */}
        <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
          <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-foreground font-display">{selected.name || "Usuário"}</SheetTitle>
                  <SheetDescription>{selected.email}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">

                  {/* ── Profile Section ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Perfil & Capacidades</h3>
                      {!editMode ? (
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-primary" onClick={startEdit}>
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditMode(false)}>Cancelar</Button>
                          <Button size="sm" className="h-7 gap-1 text-xs" onClick={saveProfile} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>

                    {editMode ? (
                      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Perfil principal (role)</Label>
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger className="bg-card"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="player">Jogador</SelectItem>
                              <SelectItem value="gm">Mestre</SelectItem>
                              <SelectItem value="store">Loja / Luderia</SelectItem>
                              <SelectItem value="brand">Marca</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pode jogar (can_play)</Label>
                          <Switch checked={editCanPlay} onCheckedChange={setEditCanPlay} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pode mestrar (can_gm)</Label>
                          <Switch checked={editCanGm} onCheckedChange={setEditCanGm} />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          ⚠️ Alterar o perfil afeta dashboard, onboarding, planos e permissões do usuário.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={<Users className="h-3.5 w-3.5" />} label="Perfil" value={selected.role ? (ROLE_LABELS[selected.role] || selected.role) : "⚠️ Não definido"} />
                        <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} label="Cidade" value={selected.city || "—"} />
                        <InfoItem icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Pode jogar" value={selected.can_play ? "Sim" : "Não"} />
                        <InfoItem icon={<Crown className="h-3.5 w-3.5" />} label="Pode mestrar" value={selected.can_gm ? "Sim" : "Não"} />
                        <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Cadastro" value={new Date(selected.created_at).toLocaleDateString("pt-BR")} />
                        <InfoItem icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Onboarding" value={selected.onboarding_completed ? "Completo" : "Pendente"} />
                      </div>
                    )}
                  </div>

                  {/* ── Plan / Subscription ── */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assinatura</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem icon={<CreditCard className="h-3.5 w-3.5" />} label="Plano" value={selected.plan_name || "Free"} />
                      <InfoItem icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" value={selected.sub_status || "Sem assinatura"} />
                      <InfoItem icon={<Star className="h-3.5 w-3.5" />} label="Founder" value={selected.is_founder ? "Sim" : "Não"} />
                      <InfoItem icon={<Trophy className="h-3.5 w-3.5" />} label="XP" value={String(selected.xp)} />
                    </div>
                  </div>

                  {/* ── Discount ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Desconto</h3>
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-primary" onClick={openDiscountDialog}>
                        <Tag className="h-3 w-3" /> {selected.discount_active ? "Editar" : "Aplicar"} desconto
                      </Button>
                    </div>
                    {selected.discount_active ? (
                      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {selected.discount_type === "percent"
                              ? `${selected.discount_percent}% de desconto`
                              : `R$ ${selected.discount_amount} de desconto`}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">{selected.discount_source}</Badge>
                        </div>
                        {selected.discount_ends_at && (
                          <p className="text-[11px] text-muted-foreground">
                            Válido até {new Date(selected.discount_ends_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeDiscount(selected.user_id)}>
                          Remover desconto
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum desconto ativo.</p>
                    )}
                  </div>

                  {/* ── Actions ── */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selected.is_active ? "destructive" : "default"}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleActive(selected.user_id, selected.is_active)}
                      >
                        {selected.is_active ? "Desativar Conta" : "Reativar Conta"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ─── Discount Dialog ─── */}
        <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-secondary" /> Aplicar Desconto
              </DialogTitle>
              <DialogDescription>
                Para {selected?.name || selected?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs mb-1.5 block">Tipo de desconto</Label>
                <Select value={discountForm.discount_type} onValueChange={(v) => setDiscountForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    <SelectItem value="free_period">Período grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountForm.discount_type === "percent" && (
                <div>
                  <Label className="text-xs mb-1.5 block">Percentual de desconto</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 20"
                    value={discountForm.percent_off}
                    onChange={(e) => setDiscountForm(f => ({ ...f, percent_off: e.target.value }))}
                    className="bg-card"
                  />
                </div>
              )}

              {discountForm.discount_type === "fixed" && (
                <div>
                  <Label className="text-xs mb-1.5 block">Valor de desconto (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 30"
                    value={discountForm.amount_off}
                    onChange={(e) => setDiscountForm(f => ({ ...f, amount_off: e.target.value }))}
                    className="bg-card"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs mb-1.5 block">Duração</Label>
                <Select value={discountForm.duration_type} onValueChange={(v) => setDiscountForm(f => ({ ...f, duration_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Primeiro ciclo apenas</SelectItem>
                    <SelectItem value="repeating">Por X meses</SelectItem>
                    <SelectItem value="until_date">Até uma data</SelectItem>
                    <SelectItem value="forever">Permanente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountForm.duration_type === "repeating" && (
                <div>
                  <Label className="text-xs mb-1.5 block">Duração em meses</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 3"
                    value={discountForm.duration_in_months}
                    onChange={(e) => setDiscountForm(f => ({ ...f, duration_in_months: e.target.value }))}
                    className="bg-card"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Data início</Label>
                  <Input
                    type="date"
                    value={discountForm.starts_at}
                    onChange={(e) => setDiscountForm(f => ({ ...f, starts_at: e.target.value }))}
                    className="bg-card"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Data fim (opcional)</Label>
                  <Input
                    type="date"
                    value={discountForm.ends_at}
                    onChange={(e) => setDiscountForm(f => ({ ...f, ends_at: e.target.value }))}
                    className="bg-card"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Origem</Label>
                <Select value={discountForm.source_type} onValueChange={(v) => setDiscountForm(f => ({ ...f, source_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Manual (Admin)</SelectItem>
                    <SelectItem value="coupon">Cupom</SelectItem>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="promo">Promoção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Observações</Label>
                <Textarea
                  placeholder="Nota interna sobre este desconto..."
                  value={discountForm.notes}
                  onChange={(e) => setDiscountForm(f => ({ ...f, notes: e.target.value }))}
                  className="bg-card resize-none"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogClose>
              <Button size="sm" className="gap-1.5" onClick={saveDiscount} disabled={discountSaving}>
                {discountSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Aplicar desconto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border p-2.5">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
