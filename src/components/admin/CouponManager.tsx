import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Tag, Plus, ToggleLeft, ToggleRight, Loader2, Percent,
  DollarSign, Calendar, Users, Eye, Hash, Clock,
} from "lucide-react";

interface Coupon {
  id: string;
  internal_name: string;
  public_code: string;
  discount_type: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string;
  duration_type: string;
  duration_in_months: number | null;
  max_redemptions: number | null;
  max_redemptions_per_user: number;
  first_time_customer_only: boolean;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  applies_to_roles_json: string[];
  redemption_count?: number;
}

export function CouponManager() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percent" | "fixed">("percent");
  const [formPercentOff, setFormPercentOff] = useState(10);
  const [formAmountOff, setFormAmountOff] = useState(1000);
  const [formDuration, setFormDuration] = useState<"once" | "repeating" | "forever">("once");
  const [formDurationMonths, setFormDurationMonths] = useState(3);
  const [formMaxRedemptions, setFormMaxRedemptions] = useState<number | "">(100);
  const [formMaxPerUser, setFormMaxPerUser] = useState(1);
  const [formFirstTimeOnly, setFormFirstTimeOnly] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formRoles, setFormRoles] = useState<string[]>([]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data: couponsData } = await supabase
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false });

    const couponsWithCounts = await Promise.all(
      (couponsData || []).map(async (c: any) => {
        const { count } = await supabase
          .from("coupon_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", c.id);
        return { ...c, redemption_count: count || 0 };
      })
    );

    setCoupons(couponsWithCounts as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  async function handleCreate() {
    if (!formName || !formCode) {
      toast({ title: "Preencha nome e código", variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(formCode)) {
      toast({ title: "Código inválido", description: "Use apenas letras, números, - e _ (sem espaços ou caracteres especiais como %).", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { data, error } = await supabase.functions.invoke("manage-coupons", {
      body: {
        action: "create",
        internal_name: formName,
        public_code: formCode,
        discount_type: formType,
        percent_off: formType === "percent" ? formPercentOff : null,
        amount_off: formType === "fixed" ? formAmountOff : null,
        currency: "BRL",
        duration_type: formDuration,
        duration_in_months: formDuration === "repeating" ? formDurationMonths : null,
        max_redemptions: formMaxRedemptions || null,
        max_redemptions_per_user: formMaxPerUser,
        first_time_customer_only: formFirstTimeOnly,
        expires_at: formExpiresAt || null,
        applies_to_roles_json: formRoles,
      },
    });

    setCreating(false);

    if (error || data?.error) {
      toast({ title: "Erro ao criar cupom", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Cupom criado! 🎉", description: `Código: ${formCode.toUpperCase()}` });
      setShowCreate(false);
      resetForm();
      fetchCoupons();
    }
  }

  async function handleToggle(couponId: string, newState: boolean) {
    setToggling(couponId);
    const { error } = await supabase.functions.invoke("manage-coupons", {
      body: { action: "toggle", coupon_id: couponId, is_active: newState },
    });
    setToggling(null);

    if (error) {
      toast({ title: "Erro", variant: "destructive" });
    } else {
      toast({ title: newState ? "Cupom ativado" : "Cupom desativado" });
      fetchCoupons();
    }
  }

  function resetForm() {
    setFormName(""); setFormCode(""); setFormType("percent");
    setFormPercentOff(10); setFormAmountOff(1000); setFormDuration("once");
    setFormDurationMonths(3); setFormMaxRedemptions(100); setFormMaxPerUser(1);
    setFormFirstTimeOnly(false); setFormExpiresAt(""); setFormRoles([]);
  }

  const toggleRole = (role: string) => {
    setFormRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-secondary" /> Cupons de Desconto
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie cupons promocionais da plataforma.</p>
        </div>
        <Button variant="hero" size="sm" className="gap-2" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" /> Criar cupom
        </Button>
      </div>

      {/* ─── CREATE FORM ─── */}
      {showCreate && (
        <div className="rounded-xl border border-secondary/20 bg-card p-6 space-y-5">
          <h3 className="text-sm font-display font-semibold text-foreground">Novo Cupom</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome interno</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cupom lançamento Mestres" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Código público</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="MESTRE20" className="uppercase" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de desconto</label>
              <div className="flex gap-2">
                <Button variant={formType === "percent" ? "default" : "outline"} size="sm" className="gap-1 flex-1" onClick={() => setFormType("percent")}>
                  <Percent className="h-3 w-3" /> Percentual
                </Button>
                <Button variant={formType === "fixed" ? "default" : "outline"} size="sm" className="gap-1 flex-1" onClick={() => setFormType("fixed")}>
                  <DollarSign className="h-3 w-3" /> Valor fixo
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {formType === "percent" ? "Percentual OFF (%)" : "Valor OFF (centavos)"}
              </label>
              {formType === "percent" ? (
                <Input type="number" value={formPercentOff} onChange={(e) => setFormPercentOff(Number(e.target.value))} min={1} max={100} />
              ) : (
                <Input type="number" value={formAmountOff} onChange={(e) => setFormAmountOff(Number(e.target.value))} min={100} />
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Duração</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value as any)}
              >
                <option value="once">Uma vez</option>
                <option value="repeating">Repetir N meses</option>
                <option value="forever">Para sempre</option>
              </select>
            </div>
            {formDuration === "repeating" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Meses</label>
                <Input type="number" value={formDurationMonths} onChange={(e) => setFormDurationMonths(Number(e.target.value))} min={1} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Validade</label>
              <Input type="date" value={formExpiresAt} onChange={(e) => setFormExpiresAt(e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Máx. resgates total</label>
              <Input type="number" value={formMaxRedemptions} onChange={(e) => setFormMaxRedemptions(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Máx. por usuário</label>
              <Input type="number" value={formMaxPerUser} onChange={(e) => setFormMaxPerUser(Number(e.target.value))} min={1} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={formFirstTimeOnly} onChange={(e) => setFormFirstTimeOnly(e.target.checked)} className="rounded" />
                <span className="text-xs text-muted-foreground">Apenas primeiro uso</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Restringir a perfis</label>
            <div className="flex gap-2 flex-wrap">
              {["gm", "store", "player", "brand"].map((role) => (
                <Button
                  key={role}
                  variant={formRoles.includes(role) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => toggleRole(role)}
                >
                  {role === "gm" ? "Mestre" : role === "store" ? "Loja" : role === "player" ? "Jogador" : "Marca"}
                </Button>
              ))}
              <span className="text-[10px] text-muted-foreground self-center">Vazio = todos</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="hero" size="sm" className="gap-2" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar cupom na Stripe
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ─── COUPONS LIST ─── */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum cupom criado.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Crie cupons promocionais para oferecer descontos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-display font-semibold text-foreground">{c.internal_name}</span>
                  <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                    {c.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono bg-muted/50 px-2 py-0.5 rounded">
                    <Hash className="h-3 w-3" /> {c.public_code}
                  </span>
                  <span className="flex items-center gap-1">
                    {c.discount_type === "percent" ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                    {c.discount_type === "percent" ? `${c.percent_off}% OFF` : `R$${((c.amount_off || 0) / 100).toFixed(2)} OFF`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {c.duration_type === "once" ? "1x" : c.duration_type === "forever" ? "Permanente" : `${c.duration_in_months}m`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {c.redemption_count || 0}{c.max_redemptions ? `/${c.max_redemptions}` : ""} usos
                  </span>
                  {c.expires_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(c.expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1"
                disabled={toggling === c.id}
                onClick={() => handleToggle(c.id, !c.is_active)}
              >
                {toggling === c.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : c.is_active ? (
                  <><ToggleRight className="h-4 w-4 text-green-500" /> Desativar</>
                ) : (
                  <><ToggleLeft className="h-4 w-4" /> Ativar</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
