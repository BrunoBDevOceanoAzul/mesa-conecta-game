/**
 * Heuristic match scoring for MVP
 * Scores 0-100 based on weighted factors
 */

export interface UserPreferences {
  city?: string | null;
  preferred_systems?: string[];
  play_styles?: string[];
  preferred_format?: string | null;
  budget_range?: string | null;
}

export interface MesaForMatch {
  city?: string | null;
  system: string;
  format: string;
  min_price: number;
  max_price: number;
  play_styles?: string[];
  session_type: string;
}

const BUDGET_RANGES: Record<string, [number, number]> = {
  "Até R$20": [0, 20],
  "R$20–40": [20, 40],
  "R$40–60": [40, 60],
  "R$60+": [60, 999],
  "Flexível": [0, 999],
};

export function calculateMatchScore(
  user: UserPreferences,
  mesa: MesaForMatch
): number {
  let score = 0;
  let totalWeight = 0;

  // City match (30 points)
  const cityWeight = 30;
  totalWeight += cityWeight;
  if (user.city && mesa.city) {
    const userCity = user.city.toLowerCase().split(",")[0].trim();
    const mesaCity = mesa.city.toLowerCase().split(",")[0].trim();
    if (userCity === mesaCity) {
      score += cityWeight;
    } else if (mesaCity.includes(userCity) || userCity.includes(mesaCity)) {
      score += cityWeight * 0.6;
    }
  } else if (!user.city) {
    // No penalty if user hasn't set city
    score += cityWeight * 0.5;
  }

  // System match (25 points)
  const systemWeight = 25;
  totalWeight += systemWeight;
  if (user.preferred_systems && user.preferred_systems.length > 0) {
    const systemLower = mesa.system.toLowerCase();
    const match = user.preferred_systems.some(
      (s) => s.toLowerCase() === systemLower
    );
    if (match) {
      score += systemWeight;
    } else {
      // Partial credit for having preferences
      score += systemWeight * 0.15;
    }
  } else {
    score += systemWeight * 0.5;
  }

  // Format match (15 points)
  const formatWeight = 15;
  totalWeight += formatWeight;
  if (user.preferred_format) {
    const pref = user.preferred_format.toLowerCase();
    const mesaFormat = mesa.format.toLowerCase();
    if (pref === "tanto faz" || pref === mesaFormat) {
      score += formatWeight;
    } else if (pref === "híbrido" || mesaFormat === "híbrido") {
      score += formatWeight * 0.7;
    }
  } else {
    score += formatWeight * 0.5;
  }

  // Price match (15 points)
  const priceWeight = 15;
  totalWeight += priceWeight;
  if (user.budget_range) {
    const range = BUDGET_RANGES[user.budget_range] || [0, 999];
    const mesaPrice = (mesa.min_price + mesa.max_price) / 2;
    if (mesaPrice >= range[0] && mesaPrice <= range[1]) {
      score += priceWeight;
    } else if (range[1] === 999) {
      // "Flexível"
      score += priceWeight;
    } else {
      // Partial credit for close prices
      const diff = Math.min(
        Math.abs(mesaPrice - range[0]),
        Math.abs(mesaPrice - range[1])
      );
      score += priceWeight * Math.max(0, 1 - diff / 50);
    }
  } else {
    score += priceWeight * 0.5;
  }

  // Play style match (15 points)
  const styleWeight = 15;
  totalWeight += styleWeight;
  if (
    user.play_styles &&
    user.play_styles.length > 0 &&
    mesa.play_styles &&
    mesa.play_styles.length > 0
  ) {
    const overlap = user.play_styles.filter((s) =>
      mesa.play_styles!.some((ms) => ms.toLowerCase() === s.toLowerCase())
    ).length;
    const maxStyles = Math.max(
      user.play_styles.length,
      mesa.play_styles.length
    );
    score += styleWeight * (overlap / maxStyles);
  } else {
    score += styleWeight * 0.4;
  }

  // Normalize to 0-100
  const normalized = Math.round((score / totalWeight) * 100);
  return Math.min(100, Math.max(0, normalized));
}

export function getMatchLabel(score: number): string {
  if (score >= 90) return "Curadoria perfeita";
  if (score >= 80) return "Alta aderência";
  if (score >= 70) return "Boa combinação";
  if (score >= 55) return "Pode interessar";
  return "Explorar";
}

export function getMatchColor(score: number): string {
  if (score >= 85) return "from-primary to-secondary";
  if (score >= 70) return "from-primary to-primary/70";
  if (score >= 55) return "from-accent to-accent/70";
  return "from-muted-foreground to-muted-foreground/70";
}
