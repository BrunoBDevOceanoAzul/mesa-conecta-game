import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import {
  Users, Search, Filter, Eye, Shield, Crown, Store, Gamepad2,
  CheckCircle2, XCircle, Mail, MapPin, Calendar, CreditCard, Star,
  Trophy, Layers, DollarSign
} from "lucide-react";

interface UserRow {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  city: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  // joined data
  sub_status: string | null;
  plan_name: string | null;
  is_founder: boolean;
  xp: number;
  badge_count: number;
  // anamnesis
  preferred_systems?: string[];
  format_preference?: string;
  experience_level?: string;
  budget_min?: number;
  budget_max?: number;
  gm_systems?: string[];
  gm_beginner_friendly?: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  player: { label: "Jogador", icon: <Gamepad2 className="h-3 w-3" />, cls: "bg-info/10 text-info border-info/20" },
  gm: { label: "Mestre", icon: <Crown className="h-3 w-3" />, cls: "bg-secondary/10 text-secondary border-secondary/20" },
  store: { label: "Luderia", icon: <Store className="h-3 w-3" />, cls: "bg-accent/10 text-accent border-accent/20" },
  brand: { label: "Marca", icon: <Star className="h-3 w-3" />, cls: "bg-primary/10 text-primary border-primary/20" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<UserRow | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const [profilesRes, subsRes, walletsRes, xpRes, badgesRes, playerRes, gmRes] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email, role, city, is_active, onboarding_completed, created_at"),
      supabase.from("subscriptions").select("user_id, status, plan_name"),
      supabase.from("credit_wallets").select("user_id, is_founder"),
      supabase.from("master_xp_profiles").select("user_id, total_xp"),
      supabase.from("master_badges").select("user_id"),
      supabase.from("player_profiles").select("user_id, preferred_systems_json, format_preference, experience_level, budget_min, budget_max"),
      supabase.from("gm_profiles").select("user_id, systems_mastered_json, beginner_friendly"),
    ]);

    const profiles = profilesRes.data || [];
    const subs = subsRes.data || [];
    const wallets = walletsRes.data || [];
    const xps = xpRes.data || [];
    const badges = badgesRes.data || [];
    const playerProfiles = playerRes.data || [];
    const gmProfiles = gmRes.data || [];

    const rows: UserRow[] = profiles.map((p) => {
      const sub = subs.find(s => s.user_id === p.user_id && s.status === "active");
      const wallet = wallets.find(w => w.user_id === p.user_id);
      const xp = xps.find(x => x.user_id === p.user_id);
      const badgeCount = badges.filter(b => b.user_id === p.user_id).length;
      const pp = playerProfiles.find(pl => pl.user_id === p.user_id);
      const gp = gmProfiles.find(g => g.user_id === p.user_id);

      return {
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        role: p.role,
        city: p.city,
        is_active: p.is_active ?? true,
        onboarding_completed: p.onboarding_completed ?? false,
        created_at: p.created_at,
        sub_status: sub?.status || null,
        plan_name: sub?.plan_name || null,
        is_founder: wallet?.is_founder || false,
        xp: xp?.total_xp || 0,
        badge_count: badgeCount,
        preferred_systems: pp?.preferred_systems_json as string[] | undefined,
        format_preference: pp?.format_preference as string | undefined,
        experience_level: pp?.experience_level as string | undefined,
        budget_min: pp?.budget_min as number | undefined,
        budget_max: pp?.budget_max as number | undefined,
        gm_systems: gp?.systems_mastered_json as string[] | undefined,
        gm_beginner_friendly: gp?.beginner_friendly as boolean | undefined,
      };
    });

    setUsers(rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (statusFilter === "onboarded" && !u.onboarding_completed) return false;
      if (statusFilter === "subscriber" && !u.sub_status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from("profiles").update({ is_active: !currentlyActive }).eq("user_id", userId);
    toast({ title: currentlyActive ? "Conta desativada" : "Conta reativada" });
    fetchUsers();
    setSelected(null);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {users.length} usuários cadastrados na plataforma.
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
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Onboarding</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Founder</th>
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
                      const rc = ROLE_CONFIG[u.role || "player"] || ROLE_CONFIG.player;
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
                            {u.onboarding_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            {u.is_founder ? (
                              <Badge variant="secondary" className="text-[10px]">Founder</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                            {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelected(u)}>
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
                Mostrando 100 de {filtered.length} resultados. Use os filtros para refinar.
              </div>
            )}
          </div>
        )}

        {/* Detail Sheet */}
        <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
          <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-foreground font-display">{selected.name || "Usuário"}</SheetTitle>
                  <SheetDescription>{selected.email}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Informações</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem icon={<Users className="h-3.5 w-3.5" />} label="Perfil" value={ROLE_CONFIG[selected.role || "player"]?.label || selected.role || "—"} />
                      <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} label="Cidade" value={selected.city || "—"} />
                      <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Cadastro" value={new Date(selected.created_at).toLocaleDateString("pt-BR")} />
                      <InfoItem icon={<CreditCard className="h-3.5 w-3.5" />} label="Plano" value={selected.plan_name || "Free"} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" value={selected.is_active ? "Ativo" : "Inativo"} />
                      <InfoItem icon={<Star className="h-3.5 w-3.5" />} label="Founder" value={selected.is_founder ? "Sim" : "Não"} />
                      <InfoItem icon={<Trophy className="h-3.5 w-3.5" />} label="XP" value={String(selected.xp)} />
                      <InfoItem icon={<Shield className="h-3.5 w-3.5" />} label="Badges" value={String(selected.badge_count)} />
                    </div>
                  </div>

                  {/* Anamnesis Data */}
                  {(selected.preferred_systems || selected.gm_systems) && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dados da Anamnese</h3>
                      {selected.preferred_systems && selected.preferred_systems.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Sistemas preferidos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.preferred_systems.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected.gm_systems && selected.gm_systems.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Sistemas dominados</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.gm_systems.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected.format_preference && (
                        <InfoItem icon={<Layers className="h-3.5 w-3.5" />} label="Formato" value={selected.format_preference} />
                      )}
                      {selected.experience_level && (
                        <InfoItem icon={<Star className="h-3.5 w-3.5" />} label="Nível" value={selected.experience_level} />
                      )}
                      {(selected.budget_min != null || selected.budget_max != null) && (
                        <InfoItem icon={<DollarSign className="h-3.5 w-3.5" />} label="Orçamento" value={`R$${selected.budget_min || 0} – R$${selected.budget_max || 0}`} />
                      )}
                      {selected.gm_beginner_friendly != null && (
                        <InfoItem icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Beginner-Friendly" value={selected.gm_beginner_friendly ? "Sim" : "Não"} />
                      )}
                    </div>
                  )}

                  {/* Actions */}
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
      </div>
    </AdminLayout>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface p-2.5">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

