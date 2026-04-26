/**
 * Épico RPG — Calculation Engine
 * ────────────────────────────────
 * Single source of truth for every derived value in an Épico RPG sheet.
 *
 * ARCHITECTURE
 * • Each formula is a standalone pure function registered in FORMULA_REGISTRY.
 * • `applyEpicoComputations` runs all formulas in dependency order.
 * • Users can override any computed field; overrides are preserved across saves.
 * • Adding a new formula = add a function + one FORMULA_REGISTRY entry.
 *
 * CONVENTIONS
 * • "Primary" = vigor, agilidade, inteligencia (user-entered).
 * • "Derived" = everything in FORMULA_REGISTRY (auto-calculated).
 * • tamanho defaults to 5 (human-sized) but can be overridden.
 */

// ─── Types ───────────────────────────────────────────────

export interface EpicoPrimary {
  vigor: number;
  agilidade: number;
  inteligencia: number;
  /** Fatigue reduces effective attribute for some rolls */
  fadiga_vigor: number;
  fadiga_agilidade: number;
  fadiga_inteligencia: number;
  /** Manual tamanho override (default 5) */
  tamanho?: number;
}

export interface EpicoComputed {
  xp_total_computed: number;
  dificuldade_alvo: number;
  forca_vontade: number;
  bonus_dano: number;
  percepcao: number;
  velocidade: number;
  tamanho: number;
  pontos_vida: number;
  pontos_vida_atual: number;
  carga_pesada: number;
  carga_maxima: number;
  vigor_efetivo: number;
  agilidade_efetiva: number;
  inteligencia_efetiva: number;
}

// ─── Helper: extract primaries from raw values ───────────

function extractPrimary(v: Record<string, any>): EpicoPrimary {
  return {
    vigor: num(v.vigor),
    agilidade: num(v.agilidade),
    inteligencia: num(v.inteligencia),
    fadiga_vigor: num(v.fadiga_vigor),
    fadiga_agilidade: num(v.fadiga_agilidade),
    fadiga_inteligencia: num(v.fadiga_inteligencia),
    tamanho: v.tamanho != null ? num(v.tamanho) : undefined,
  };
}

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ─── XP calculation from attributes + aptidões ───────────

/**
 * XP invested = sum of attribute costs + aptidão dots.
 * Épico uses a triangular cost: attribute level N costs N×10 XP.
 * Total XP = Σ attr_cost + aptidão_dots × 5  (simplified).
 */
function computeXpTotal(v: Record<string, any>): number {
  const p = extractPrimary(v);
  const attrCost = triangularCost(p.vigor) + triangularCost(p.agilidade) + triangularCost(p.inteligencia);

  // Sum dots from dynamic lists (aptidões, virtudes, etc.)
  const listKeys = ["aptidoes", "virtudes", "defeitos"];
  let dotTotal = 0;
  for (const key of listKeys) {
    const list = v[key];
    if (Array.isArray(list)) {
      for (const item of list) {
        dotTotal += num(item?.value);
      }
    }
  }

  return attrCost + dotTotal * 5;
}

/** Triangular cost: level N costs 10+20+…+N×10 = N×(N+1)×5 */
function triangularCost(level: number): number {
  return level * (level + 1) * 5;
}

// ─── Formula Registry ────────────────────────────────────
// Each entry: [fieldKey, formula(primaries, rawValues) => number]
// Order matters: later entries can depend on earlier ones via rawValues.

type FormulaFn = (p: EpicoPrimary, v: Record<string, any>) => number;

const FORMULA_REGISTRY: [string, FormulaFn][] = [
  // Effective attributes (after fatigue)
  ["vigor_efetivo",         (p) => Math.max(0, p.vigor - p.fadiga_vigor)],
  ["agilidade_efetiva",     (p) => Math.max(0, p.agilidade - p.fadiga_agilidade)],
  ["inteligencia_efetiva",  (p) => Math.max(0, p.inteligencia - p.fadiga_inteligencia)],

  // Tamanho (default human = 5, overridable)
  ["tamanho",               (p) => p.tamanho ?? 5],

  // Core secondary attributes
  ["dificuldade_alvo",      (p) => 10 + Math.max(0, p.vigor - p.fadiga_vigor) + Math.max(0, p.agilidade - p.fadiga_agilidade)],
  ["forca_vontade",         (p) => Math.max(0, p.inteligencia - p.fadiga_inteligencia) * 2],
  ["bonus_dano",            (p) => Math.max(0, Math.max(0, p.vigor - p.fadiga_vigor) - 3)],
  ["percepcao",             (p) => Math.max(0, p.inteligencia - p.fadiga_inteligencia) + 2],
  ["velocidade",            (p) => Math.max(0, p.agilidade - p.fadiga_agilidade) + 3],

  // Health & encumbrance (depend on tamanho which is resolved above)
  ["pontos_vida",           (p, v) => Math.max(0, p.vigor - p.fadiga_vigor) + num(v.tamanho)],
  ["pontos_vida_atual",     (p, v) => num(v.pontos_vida) - num(v.ferimentos)],
  ["carga_pesada",          (p) => Math.max(0, p.vigor - p.fadiga_vigor) * 3],
  ["carga_maxima",          (p) => Math.max(0, p.vigor - p.fadiga_vigor) * 5],

  // XP total (depends on everything)
  ["xp_total_computed",     (_p, v) => computeXpTotal(v)],
];

// ─── Public API ──────────────────────────────────────────

/** Set of all field keys that are auto-computed */
export const EPICO_COMPUTED_FIELDS = new Set(
  FORMULA_REGISTRY.map(([key]) => key)
);

/**
 * Apply all formulas to a raw values object.
 * Fields in `manualOverrides` are kept as-is (user took control).
 * Returns a new values object with computed fields filled in.
 */
export function applyEpicoComputations(
  values: Record<string, any>,
  manualOverrides: Set<string>
): Record<string, any> {
  const p = extractPrimary(values);
  const result = { ...values };

  for (const [key, formula] of FORMULA_REGISTRY) {
    if (!manualOverrides.has(key)) {
      result[key] = formula(p, result);
    }
  }

  return result;
}

/**
 * Get a human-readable explanation of how a field is calculated.
 * Useful for tooltips / help text in the UI.
 */
export function getFormulaHint(fieldKey: string): string | null {
  const hints: Record<string, string> = {
    vigor_efetivo: "Vigor − Fadiga (Vigor)",
    agilidade_efetiva: "Agilidade − Fadiga (Agilidade)",
    inteligencia_efetiva: "Inteligência − Fadiga (Inteligência)",
    dificuldade_alvo: "10 + Vigor efetivo + Agilidade efetiva",
    forca_vontade: "Inteligência efetiva × 2",
    bonus_dano: "Vigor efetivo − 3 (mín. 0)",
    percepcao: "Inteligência efetiva + 2",
    velocidade: "Agilidade efetiva + 3",
    tamanho: "Padrão humano = 5 (ajustável)",
    pontos_vida: "Vigor efetivo + Tamanho",
    pontos_vida_atual: "Pontos de Vida − Ferimentos",
    carga_pesada: "Vigor efetivo × 3",
    carga_maxima: "Vigor efetivo × 5",
    xp_total_computed: "Custo dos atributos + aptidões × 5",
  };
  return hints[fieldKey] ?? null;
}
