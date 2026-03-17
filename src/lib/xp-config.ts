/**
 * XP system configuration for HIVIUM Master progression.
 */

export interface XpAction {
  type: string;
  label: string;
  xp: number;
  description: string;
}

export const XP_ACTIONS: XpAction[] = [
  { type: "onboarding_completed", label: "Onboarding concluído", xp: 50, description: "Complete o processo de entrada na plataforma" },
  { type: "first_table_created", label: "Primeira mesa publicada", xp: 80, description: "Publique sua primeira mesa na HIVIUM" },
  { type: "third_table_created", label: "3 mesas publicadas", xp: 120, description: "Publique 3 mesas na plataforma" },
  { type: "first_booking", label: "Primeira reserva", xp: 100, description: "Receba sua primeira reserva de jogador" },
  { type: "table_filled", label: "Mesa lotada", xp: 150, description: "Lote uma mesa inteira" },
  { type: "positive_review", label: "Avaliação positiva", xp: 40, description: "Receba uma avaliação positiva" },
  { type: "post_published", label: "Post no feed", xp: 20, description: "Publique conteúdo no feed" },
  { type: "used_boost", label: "Destaque usado", xp: 30, description: "Use um destaque na plataforma" },
  { type: "crm_lead_converted", label: "Lead convertido", xp: 60, description: "Converta um lead pelo CRM" },
  { type: "campaign_completed", label: "Campanha concluída", xp: 90, description: "Complete uma campanha de destaque" },
  { type: "active_30_days", label: "30 dias ativos", xp: 120, description: "Opere por 30 dias na plataforma" },
  { type: "active_90_days", label: "90 dias ativos", xp: 250, description: "Opere por 90 dias contínuos" },
  { type: "subscription_renewed", label: "Assinatura renovada", xp: 90, description: "Renove sua assinatura mensal" },
];

export interface XpTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  description: string;
}

export const XP_TIERS: XpTier[] = [
  { level: 1, title: "Iniciante", minXp: 0, maxXp: 99, description: "Primeiros passos no mundo HIVIUM" },
  { level: 2, title: "Condutor", minXp: 100, maxXp: 299, description: "Guiando aventureiros com confiança" },
  { level: 3, title: "Curador", minXp: 300, maxXp: 599, description: "Curadoria de experiências memoráveis" },
  { level: 4, title: "Estrategista", minXp: 600, maxXp: 999, description: "Planejamento tático e visão de longo prazo" },
  { level: 5, title: "Arquiteto de Mesas", minXp: 1000, maxXp: 1599, description: "Construindo mundos que jogadores não esquecem" },
  { level: 6, title: "Mestre de Círculo", minXp: 1600, maxXp: 2499, description: "Líder reconhecido pela comunidade HIVIUM" },
  { level: 7, title: "Lendário", minXp: 2500, maxXp: Infinity, description: "Uma lenda viva da plataforma" },
];

export function getTierForXp(xp: number): XpTier {
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].minXp) return XP_TIERS[i];
  }
  return XP_TIERS[0];
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const tier = getTierForXp(xp);
  const nextTier = XP_TIERS.find((t) => t.level === tier.level + 1);
  if (!nextTier) return { current: xp, needed: xp, percent: 100 };
  const inTier = xp - tier.minXp;
  const tierRange = nextTier.minXp - tier.minXp;
  return { current: inTier, needed: tierRange, percent: Math.min(100, Math.round((inTier / tierRange) * 100)) };
}

export function getXpActionAmount(actionType: string): number {
  return XP_ACTIONS.find((a) => a.type === actionType)?.xp || 0;
}

/** Rarity colors for badge rendering */
export const RARITY_CONFIG: Record<string, { label: string; className: string; gradient: string }> = {
  common: { label: "Comum", className: "text-muted-foreground border-border", gradient: "from-muted to-muted" },
  rare: { label: "Raro", className: "text-info border-info/30", gradient: "from-info/20 to-info/5" },
  epic: { label: "Épico", className: "text-primary border-primary/30", gradient: "from-primary/20 to-primary/5" },
  legendary: { label: "Lendário", className: "text-secondary border-secondary/30", gradient: "from-secondary/20 to-secondary/5" },
};

/** Category label map */
export const CATEGORY_LABELS: Record<string, string> = {
  founder: "Founder",
  consistency: "Consistência",
  growth: "Crescimento",
  community: "Comunidade",
  quality: "Qualidade",
  general: "Geral",
};
