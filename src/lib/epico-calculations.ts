/**
 * Épico RPG — Calculation Engine
 * Centralized formulas for derived attributes.
 * All formulas are approximations of the Épico RPG rules.
 */

export interface EpicoComputed {
  dificuldade_alvo: number;
  forca_vontade: number;
  bonus_dano: number;
  percepcao: number;
  velocidade: number;
  tamanho: number;
  pontos_vida: number;
  carga_pesada: number;
  carga_maxima: number;
}

/**
 * Compute derived attributes from primary attributes.
 * Users can override any computed value manually.
 */
export function computeEpicoSecondary(
  vigor: number,
  agilidade: number,
  inteligencia: number,
  tamanhoOverride?: number
): EpicoComputed {
  const tamanho = tamanhoOverride ?? 5; // default human size
  return {
    dificuldade_alvo: 10 + vigor + agilidade,
    forca_vontade: inteligencia * 2,
    bonus_dano: Math.max(0, vigor - 3),
    percepcao: inteligencia + 2,
    velocidade: agilidade + 3,
    tamanho,
    pontos_vida: vigor + tamanho,
    carga_pesada: vigor * 3,
    carga_maxima: vigor * 5,
  };
}

/**
 * Apply computations to a values object, preserving manual overrides.
 * Only overwrites fields that haven't been manually edited.
 */
export function applyEpicoComputations(
  values: Record<string, any>,
  manualOverrides: Set<string>
): Record<string, any> {
  const vigor = Number(values.vigor) || 0;
  const agilidade = Number(values.agilidade) || 0;
  const inteligencia = Number(values.inteligencia) || 0;
  const tamanhoOverride = manualOverrides.has("tamanho")
    ? Number(values.tamanho) || 5
    : undefined;

  const computed = computeEpicoSecondary(vigor, agilidade, inteligencia, tamanhoOverride);

  const result = { ...values };
  for (const [key, val] of Object.entries(computed)) {
    if (!manualOverrides.has(key)) {
      result[key] = val;
    }
  }

  return result;
}

/** List of fields that are auto-computed */
export const EPICO_COMPUTED_FIELDS = new Set([
  "dificuldade_alvo",
  "forca_vontade",
  "bonus_dano",
  "percepcao",
  "velocidade",
  "tamanho",
  "pontos_vida",
  "carga_pesada",
  "carga_maxima",
]);
