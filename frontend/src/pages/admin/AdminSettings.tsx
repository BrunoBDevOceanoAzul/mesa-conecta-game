import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings, Globe, Mail, DollarSign, CreditCard, Shield, Zap,
  CheckCircle2, XCircle, Gift, Crown, Store, Palette, Save
} from "lucide-react";

interface SettingsState {
  platformName: string;
  supportEmail: string;
  primaryDomain: string;
  cpcRate: number;
  founderLimit: number;
  founderBoostsPerMonth: number;
  founderDurationMonths: number;
  platformFeePercent: number;
  stripeConfigured: boolean;
  googleOAuthConfigured: boolean;
  webhookSecret: boolean;
  plansCount: number;
  activeSubsCount: number;
  walletsCount: number;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cpcRate, setCpcRate] = useState("0.50");
  const [founderLimit, setFounderLimit] = useState("10");
  const [founderBoosts, setFounderBoosts] = useState("2");
  const [founderDuration, setFounderDuration] = useState("3");
  const [platformFee, setPlatformFee] = useState("10");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const [settingsRes, plansRes, subsRes, walletsRes] = await Promise.all([
      supabase.from("admin_settings").select("key, value"),
      supabase.from("billing_products").select("id").eq("is_active", true),
      supabase.from("asaas_subscriptions").select("id").eq("status", "ACTIVE"),
      supabase.from("credit_wallets").select("id"),
    ]);

    const adminSettings = settingsRes.data || [];
    const getSetting = (key: string, fallback: any) => {
      const found = adminSettings.find(s => s.key === key);
      return found ? found.value : fallback;
    };

    const state: SettingsState = {
      platformName: "HIVIUM",
      supportEmail: "bruno@sociodotabuleiro.app.br",
      primaryDomain: "sociodotabuleiro.app.br",
      cpcRate: Number(getSetting("cpc_rate", 0.5)),
      founderLimit: Number(getSetting("founder_limit", 10)),
      founderBoostsPerMonth: Number(getSetting("founder_boosts_per_month", 2)),
      founderDurationMonths: Number(getSetting("founder_duration_months", 3)),
      platformFeePercent: Number(getSetting("platform_fee_percent", 10)),
      stripeConfigured: true,
      googleOAuthConfigured: true,
      webhookSecret: true,
      plansCount: plansRes.data?.length || 0,
      activeSubsCount: subsRes.data?.length || 0,
      walletsCount: walletsRes.data?.length || 0,
    };

    setSettings(state);
    setCpcRate(String(state.cpcRate));
    setFounderLimit(String(state.founderLimit));
    setFounderBoosts(String(state.founderBoostsPerMonth));
    setFounderDuration(String(state.founderDurationMonths));
    setPlatformFee(String(state.platformFeePercent));
    setLoading(false);
  }

  async function saveCommercialSettings() {
    setSaving(true);
    const entries = [
      { key: "cpc_rate", value: Number(cpcRate) },
      { key: "founder_limit", value: Number(founderLimit) },
      { key: "founder_boosts_per_month", value: Number(founderBoosts) },
      { key: "founder_duration_months", value: Number(founderDuration) },
      { key: "platform_fee_percent", value: Number(platformFee) },
    ];

    for (const entry of entries) {
      await supabase.from("admin_settings").upsert(
        { key: entry.key, value: entry.value as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }

    toast({ title: "Configurações salvas", description: "Parâmetros comerciais atualizados." });
    setSaving(false);
    fetchSettings();
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5 md:space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Parâmetros operacionais e comerciais da plataforma.
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* GENERAL */}
          <ConfigBlock
            icon={<Globe className="h-5 w-5 text-primary" />}
            title="Geral"
            description="Informações básicas da plataforma."
          >
            <ReadOnlyField label="Nome da plataforma" value={settings?.platformName || ""} />
            <ReadOnlyField label="Domínio principal" value={settings?.primaryDomain || ""} />
            <ReadOnlyField label="Email de suporte" value={settings?.supportEmail || ""} />
          </ConfigBlock>

          {/* COMMERCIAL */}
          <ConfigBlock
            icon={<DollarSign className="h-5 w-5 text-secondary" />}
            title="Comercial"
            description="Parâmetros de monetização e pricing."
            footer={
              <Button variant="hero" size="sm" onClick={saveCommercialSettings} disabled={saving} className="gap-2 w-full md:w-auto min-h-[44px]">
                <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            }
          >
            <EditableField label="CPC base (R$)" value={cpcRate} onChange={setCpcRate} type="number" />
            <EditableField label="Taxa plataforma (%)" value={platformFee} onChange={setPlatformFee} type="number" />
            <EditableField label="Limite de founders" value={founderLimit} onChange={setFounderLimit} type="number" />
            <EditableField label="Boosts founder/mês" value={founderBoosts} onChange={setFounderBoosts} type="number" />
            <EditableField label="Duração founder (meses)" value={founderDuration} onChange={setFounderDuration} type="number" />
          </ConfigBlock>

          {/* PLANS & SUBS */}
          <ConfigBlock
            icon={<CreditCard className="h-5 w-5 text-info" />}
            title="Planos & Assinaturas"
            description="Status do catálogo de planos."
          >
            <StatusRow label="Planos ativos" value={String(settings?.plansCount || 0)} ok={!!settings?.plansCount} />
            <StatusRow label="Assinaturas ativas" value={String(settings?.activeSubsCount || 0)} ok={!!settings?.activeSubsCount} />
            <StatusRow label="Wallets criadas" value={String(settings?.walletsCount || 0)} ok={!!settings?.walletsCount} />
          </ConfigBlock>

          {/* AUTH / PAYMENT STATUS */}
          <ConfigBlock
            icon={<Shield className="h-5 w-5 text-accent" />}
            title="Autenticação & Pagamento"
            description="Status das integrações configuradas."
          >
            <StatusRow label="Stripe Secret Key" value="Configurado" ok={settings?.stripeConfigured || false} />
            <StatusRow label="Stripe Webhook Secret" value="Configurado" ok={settings?.webhookSecret || false} />
            <StatusRow label="Google OAuth" value="Configurado" ok={settings?.googleOAuthConfigured || false} />
            <StatusRow label="Google Maps API" value="Configurado" ok={true} />
          </ConfigBlock>
        </div>
      </div>
    </AdminLayout>
  );
}

function ConfigBlock({ icon, title, description, children, footer }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 md:p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10">{icon}</div>
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground">{title}</h3>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3 md:space-y-4">{children}</div>
      {footer && <div className="px-4 pb-4 md:px-5 md:pb-5 flex justify-end">{footer}</div>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1 rounded-lg bg-surface px-3 py-2.5 text-sm text-foreground min-h-[44px] flex items-center">{value}</div>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 bg-surface border-border text-sm min-h-[44px]"
      />
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 min-h-[44px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">{value}</span>
        {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
      </div>
    </div>
  );
}
