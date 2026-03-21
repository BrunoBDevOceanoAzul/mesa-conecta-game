import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator, Zap, TrendingUp, Target, Users, Clock, DollarSign,
  Monitor, Home, RefreshCw, Star, ChevronRight
} from "lucide-react";

type MesaType = "one_shot" | "campaign" | "event" | "solo";
type Format = "online" | "presencial" | "hybrid";
type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
type ProductionLevel = "basic" | "standard" | "premium" | "luxury";

const mesaTypeLabels: Record<MesaType, string> = {
  one_shot: "One-Shot",
  campaign: "Campanha",
  event: "Evento",
  solo: "Solo / Premium",
};

const formatLabels: Record<Format, string> = {
  online: "Online",
  presencial: "Presencial",
  hybrid: "Híbrido",
};

const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
  expert: "Expert",
};

const productionLabels: Record<ProductionLevel, string> = {
  basic: "Básico",
  standard: "Padrão",
  premium: "Premium",
  luxury: "Alta Curadoria",
};

// Market reference multipliers
const mesaTypeMultiplier: Record<MesaType, number> = {
  campaign: 1.0,
  one_shot: 1.15,
  event: 1.25,
  solo: 1.8,
};

const formatMultiplier: Record<Format, number> = {
  online: 1.0,
  presencial: 1.15,
  hybrid: 1.08,
};

const experienceMultiplier: Record<ExperienceLevel, number> = {
  beginner: 0.85,
  intermediate: 1.0,
  advanced: 1.2,
  expert: 1.45,
};

const productionMultiplier: Record<ProductionLevel, number> = {
  basic: 1.0,
  standard: 1.1,
  premium: 1.3,
  luxury: 1.6,
};

// Asaas fee references (Brazil)
const ASAAS_CARD_PERCENT = 2.99;
const ASAAS_CARD_FIXED_BRL = 0.0;
const ASAAS_PIX_PERCENT = 1.99;
const ASAAS_PIX_FIXED_BRL = 0.0;
const ASAAS_BOLETO_FIXED_BRL = 1.99;

interface CalculatorState {
  prepHours: number;
  sessionHours: number;
  hourlyRate: number;
  mesaType: MesaType;
  format: Format;
  players: number;
  experience: ExperienceLevel;
  production: ProductionLevel;
  monthlyGoal: number;
  mesasPerMonth: number;
  extraCosts: number;
  platformFee: number;
}

const PLATFORM_FEE = 5; // Fixed 5% platform split

const defaultState: CalculatorState = {
  prepHours: 2,
  sessionHours: 4,
  hourlyRate: 35,
  mesaType: "campaign",
  format: "online",
  players: 5,
  experience: "intermediate",
  production: "standard",
  monthlyGoal: 2000,
  mesasPerMonth: 4,
  extraCosts: 0,
  platformFee: PLATFORM_FEE,
  hasStore: false,
};

const presets = [
  { label: "Campanha Online", icon: Monitor, state: { ...defaultState, mesaType: "campaign" as MesaType, format: "online" as Format, hourlyRate: 35, players: 5 } },
  { label: "One-Shot Presencial", icon: Home, state: { ...defaultState, mesaType: "one_shot" as MesaType, format: "presencial" as Format, hourlyRate: 40, players: 5, extraCosts: 20 } },
  { label: "Solo Premium", icon: Star, state: { ...defaultState, mesaType: "solo" as MesaType, format: "online" as Format, hourlyRate: 60, players: 1, production: "premium" as ProductionLevel } },
];

interface PricingCalculatorProps {
  /** When provided, shows "Usar preço" buttons that apply min/max to a form */
  onApplyPrice?: (min: number, max: number) => void;
  /** If true, renders in a compact mode (no goal tracker) */
  compact?: boolean;
}

export function PricingCalculator({ onApplyPrice, compact }: PricingCalculatorProps = {}) {
  const [state, setState] = useState<CalculatorState>(defaultState);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const update = (partial: Partial<CalculatorState>) => {
    setState((prev) => ({ ...prev, ...partial }));
    setActivePreset(null);
  };

  const results = useMemo(() => {
    const totalHours = state.prepHours + state.sessionHours;
    const baseCost = totalHours * state.hourlyRate + state.extraCosts;
    const withFee = baseCost * (1 + state.platformFee / 100);

    // Market-adjusted price per player
    const marketBase = 35; // R$35 base reference
    const adjusted = marketBase
      * mesaTypeMultiplier[state.mesaType]
      * formatMultiplier[state.format]
      * experienceMultiplier[state.experience]
      * productionMultiplier[state.production];

    const minSustainable = withFee / Math.max(state.players, 1);
    const suggested = Math.max(minSustainable, adjusted);

    const conservative = Math.round(suggested * 0.85);
    const market = Math.round(suggested);
    const premium = Math.round(suggested * 1.25);

    const revenuePerMesa = market * state.players;

    // Fee simulations per player at market price
    const cardFeePerPlayer = +(market * STRIPE_CARD_PERCENT / 100 + STRIPE_CARD_FIXED_BRL).toFixed(2);
    const pixFeePerPlayer = +(market * STRIPE_PIX_PERCENT / 100 + STRIPE_PIX_FIXED_BRL).toFixed(2);
    const platformFeePerPlayer = +(market * state.platformFee / 100).toFixed(2);

    const netPerPlayerCard = +(market - cardFeePerPlayer - platformFeePerPlayer).toFixed(2);
    const netPerPlayerPix = +(market - pixFeePerPlayer - platformFeePerPlayer).toFixed(2);

    const monthlyRevenue = revenuePerMesa * state.mesasPerMonth;

    const mesasToGoal = state.monthlyGoal > 0
      ? Math.ceil(state.monthlyGoal / Math.max(revenuePerMesa, 1))
      : 0;

    const occupancyForGoal = state.mesasPerMonth > 0
      ? Math.min(Math.round((mesasToGoal / state.mesasPerMonth) * 100), 100)
      : 0;

    return {
      minSustainable: Math.round(minSustainable),
      suggested: Math.round(suggested),
      conservative,
      market,
      premium,
      revenuePerMesa: Math.round(revenuePerMesa),
      monthlyRevenue: Math.round(monthlyRevenue),
      mesasToGoal,
      occupancyForGoal,
      totalHours,
      withFee: Math.round(withFee),
      cardFeePerPlayer,
      pixFeePerPlayer,
      platformFeePerPlayer,
      netPerPlayerCard,
      netPerPlayerPix,
    };
  }, [state]);

  const goalProgress = state.monthlyGoal > 0
    ? Math.min(Math.round((results.monthlyRevenue / state.monthlyGoal) * 100), 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Calculadora de Preço + Meta
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Defina seu preço com base no mercado e acompanhe sua meta de ganho.
        </p>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((p, idx) => (
          <button
            key={p.label}
            onClick={() => { setState(p.state); setActivePreset(idx); }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              activePreset === idx
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <p.icon className="h-3.5 w-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Inputs */}
        <div className="p-6 space-y-5">
          {/* Row 1: Basic inputs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CalcInput label="Prep (horas)" value={state.prepHours} onChange={(v) => update({ prepHours: v })} min={0} max={20} suffix="h" />
            <CalcInput label="Sessão (horas)" value={state.sessionHours} onChange={(v) => update({ sessionHours: v })} min={1} max={12} suffix="h" />
            <CalcInput label="Valor-hora" value={state.hourlyRate} onChange={(v) => update({ hourlyRate: v })} min={10} max={500} prefix="R$" />
            <CalcInput label="Jogadores" value={state.players} onChange={(v) => update({ players: v })} min={1} max={12} />
          </div>

          {/* Row 2: Type selectors */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Tipo da mesa" value={state.mesaType} options={mesaTypeLabels} onChange={(v) => update({ mesaType: v as MesaType })} />
            <SelectField label="Formato" value={state.format} options={formatLabels} onChange={(v) => update({ format: v as Format })} />
            <SelectField label="Experiência" value={state.experience} options={experienceLabels} onChange={(v) => update({ experience: v as ExperienceLevel })} />
            <SelectField label="Produção" value={state.production} options={productionLabels} onChange={(v) => update({ production: v as ProductionLevel })} />
          </div>

          {/* Row 3: Goals */}
          <div className="grid gap-4 sm:grid-cols-3">
            <CalcInput label="Meta mensal" value={state.monthlyGoal} onChange={(v) => update({ monthlyGoal: v })} min={0} max={50000} prefix="R$" />
            <CalcInput label="Mesas/mês" value={state.mesasPerMonth} onChange={(v) => update({ mesasPerMonth: v })} min={1} max={30} />
            <CalcInput label="Custos extras" value={state.extraCosts} onChange={(v) => update({ extraCosts: v })} min={0} max={1000} prefix="R$" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Taxa HIVIUM (lançamento)</span>
              <span className="text-sm font-semibold text-foreground">{state.platformFee}%</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => update({ platformFee: PLATFORM_FEE_MIN })}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${state.platformFee === PLATFORM_FEE_MIN ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {PLATFORM_FEE_MIN}% — Lançamento
              </button>
              <button
                onClick={() => update({ platformFee: PLATFORM_FEE_MAX })}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${state.platformFee === PLATFORM_FEE_MAX ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {PLATFORM_FEE_MAX}% — Padrão
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              🚀 Taxa de lançamento: apenas {PLATFORM_FEE_MIN}% nos primeiros meses. Concorrentes cobram 15–20%.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-border bg-muted/20 p-6 space-y-5">
          {/* Price ranges */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Faixa de preço por jogador</h3>
            <div className="grid grid-cols-3 gap-3">
              <PricePill label="Conservador" value={results.conservative} onClick={onApplyPrice ? () => onApplyPrice(results.conservative, results.conservative) : undefined} />
              <PricePill label="Mercado" value={results.market} highlight onClick={onApplyPrice ? () => onApplyPrice(results.conservative, results.market) : undefined} />
              <PricePill label="Premium" value={results.premium} accent onClick={onApplyPrice ? () => onApplyPrice(results.market, results.premium) : undefined} />
            </div>
          </div>

          {/* Revenue estimates */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Mínimo sustentável" value={`R$${results.minSustainable}`} icon={<DollarSign className="h-3.5 w-3.5" />} />
            <MiniStat label="Receita por mesa" value={`R$${results.revenuePerMesa}`} icon={<Users className="h-3.5 w-3.5" />} />
            <MiniStat label="Receita estimada/mês" value={`R$${results.monthlyRevenue}`} icon={<TrendingUp className="h-3.5 w-3.5" />} />
            <MiniStat label="Mesas para a meta" value={`${results.mesasToGoal}`} icon={<Target className="h-3.5 w-3.5" />} />
          </div>

          {/* Payment method fee breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Taxas por método de pagamento (preço Mercado: R${results.market})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Card */}
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Cartão</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">{STRIPE_CARD_PERCENT}% + R${STRIPE_CARD_FIXED_BRL.toFixed(2)}</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Taxa Stripe</span><span className="text-foreground">-R${results.cardFeePerPlayer}</span></div>
                  <div className="flex justify-between"><span>Taxa Plataforma ({state.platformFee}%)</span><span className="text-foreground">-R${results.platformFeePerPlayer}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><span className="text-foreground">Você recebe</span><span className="text-primary">R${results.netPerPlayerCard}/jogador</span></div>
                </div>
              </div>
              {/* PIX */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">PIX</span>
                  <Badge variant="default" className="ml-auto text-[10px]">{STRIPE_PIX_PERCENT}%</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Taxa Stripe</span><span className="text-foreground">-R${results.pixFeePerPlayer}</span></div>
                  <div className="flex justify-between"><span>Taxa Plataforma ({state.platformFee}%)</span><span className="text-foreground">-R${results.platformFeePerPlayer}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><span className="text-foreground">Você recebe</span><span className="text-primary">R${results.netPerPlayerPix}/jogador</span></div>
                </div>
                <p className="text-[10px] text-primary font-medium">💡 PIX = menor taxa → mais lucro!</p>
              </div>
            </div>
          </div>

          {!compact && state.monthlyGoal > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta do Mês
                </h3>
                <Badge variant={goalProgress >= 100 ? "premium" : "default"}>
                  {goalProgress}%
                </Badge>
              </div>
              <Progress value={goalProgress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Projeção: R${results.monthlyRevenue}</span>
                <span>Meta: R${state.monthlyGoal}</span>
              </div>
              {goalProgress >= 100 && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2">
                  <Zap className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs text-success font-medium">Parabéns! Projeção acima da meta! 🎉</span>
                </div>
              )}
              {goalProgress < 100 && goalProgress > 0 && (
                <p className="text-xs text-muted-foreground">
                  Faltam <strong className="text-foreground">{results.mesasToGoal - state.mesasPerMonth > 0 ? results.mesasToGoal - state.mesasPerMonth : 0} mesas lotadas</strong> ou aumento de preço para atingir a meta.
                </p>
              )}
            </div>
          )}

          {/* Value Proposition */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <h3 className="text-sm font-display font-semibold text-foreground">
              💎 Por que pagar pela HIVIUM?
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Menor custo do mercado.</strong> Plataformas concorrentes cobram de 15% a 20% por mesa vendida. A HIVIUM cobra apenas <strong className="text-primary">{PLATFORM_FEE_MIN}–{PLATFORM_FEE_MAX}%</strong> de taxa de intermediação — até 5x menos que a concorrência.
              </p>
              <p>
                <strong className="text-foreground">Mais ferramentas, mais autonomia.</strong> Com a assinatura você acessa CRM de jogadores, calculadora de precificação inteligente, automação de reservas, analytics de desempenho, campanhas de destaque e estúdio IA — tudo integrado em um lugar só. Nenhum concorrente entrega esse nível de ferramenta por esse preço.
              </p>
              <p>
                <strong className="text-foreground">Você ganha mais por mesa.</strong> Compare: em outras plataformas, uma mesa de R$50/jogador com 5 jogadores te deixa com R$200–R$212. Na HIVIUM com PIX, você recebe até <strong className="text-primary">R${(50 * 5 * (1 - PLATFORM_FEE_MIN / 100 - STRIPE_PIX_PERCENT / 100)).toFixed(0)}</strong> — quase R$40 a mais por sessão.
              </p>
              <p>
                <strong className="text-foreground">Assinatura que se paga sozinha.</strong> O plano Pro custa R$19,90/mês. Com 1 mesa paga você já recupera o investimento. Toda mesa adicional é lucro direto no seu bolso.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concorrentes</p>
                <p className="text-lg font-bold text-destructive">15–20%</p>
                <p className="text-[10px] text-muted-foreground">taxa por mesa</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
                <p className="text-[10px] text-primary uppercase tracking-wider font-medium">HIVIUM</p>
                <p className="text-lg font-bold text-primary">{PLATFORM_FEE_MIN}–{PLATFORM_FEE_MAX}%</p>
                <p className="text-[10px] text-muted-foreground">taxa por mesa</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Referência de mercado: R$30–40/jogador/sessão (campanha online). Ajuste conforme formato, curadoria e experiência. Valores são estimativas — adapte ao seu contexto.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function CalcInput({ label, value, onChange, min, max, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30 transition-all">
        {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: Record<T, string>; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>{v as string}</option>
        ))}
      </select>
    </div>
  );
}

function PricePill({ label, value, highlight, accent, onClick }: { label: string; value: number; highlight?: boolean; accent?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl border p-4 text-center transition-all ${
        highlight
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : accent
            ? "border-secondary/20 bg-secondary/5"
            : "border-border bg-card"
      } ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30 active:scale-95" : ""}`}
    >
      <p className={`text-xl font-display font-bold ${
        highlight ? "text-primary" : accent ? "text-secondary" : "text-foreground"
      }`}>
        R${value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
      {onClick && <p className="text-[9px] text-primary mt-1 font-medium">Usar preço</p>}
    </button>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-display font-bold text-foreground truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
