/**
 * Generates profile badges based on onboarding answers.
 */

import type { RoleKey } from "./onboarding-steps";

export interface Badge {
  label: string;
  color: "primary" | "secondary" | "accent" | "muted";
}

export function generateBadges(
  role: RoleKey,
  answers: Record<string, unknown>
): Badge[] {
  const badges: Badge[] = [];

  if (role === "jogador") {
    // Experience
    const exp = answers.experience_level as string;
    if (exp === "Nunca joguei") badges.push({ label: "Primeira Aventura", color: "accent" });
    if (exp === "Veterano") badges.push({ label: "Veterano", color: "secondary" });

    // Session format
    const fmt = answers.session_format_pref as string;
    if (fmt === "Campanha") badges.push({ label: "Campanha Lover", color: "primary" });
    if (fmt === "One-shot") badges.push({ label: "One-shot Ready", color: "primary" });

    // Budget
    const budget = answers.budget_range as string;
    if (budget === "Até R$20") badges.push({ label: "Budget Smart", color: "muted" });
    if (budget?.includes("70+")) badges.push({ label: "Premium Seeker", color: "secondary" });
    if (budget === "Flexível") badges.push({ label: "Flexível", color: "muted" });

    // Format
    const format = answers.preferred_format as string;
    if (format === "Presencial") badges.push({ label: "Presencial", color: "primary" });
    if (format === "Online") badges.push({ label: "Digital Player", color: "primary" });

    // Availability
    const times = answers.availability_times as string[] | undefined;
    if (times?.includes("Noite") || times?.includes("Madrugada")) {
      badges.push({ label: "Noturno", color: "accent" });
    }

    // Themes
    const themes = answers.themes_liked as string[] | undefined;
    if (themes?.includes("Horror")) badges.push({ label: "Horror Fan", color: "accent" });
    if (themes?.includes("Fantasia")) badges.push({ label: "Fantasy Lover", color: "primary" });
    if (themes?.includes("Ficção científica")) badges.push({ label: "Sci-fi Explorer", color: "primary" });

    // Styles
    const styles = answers.play_styles as string[] | undefined;
    if (styles?.includes("Interpretação")) badges.push({ label: "Roleplay First", color: "secondary" });
    if (styles?.includes("Combate")) badges.push({ label: "Combat Ready", color: "accent" });
  }

  if (role === "mestre") {
    const years = answers.years_mastering as string;
    if (years?.includes("10+")) badges.push({ label: "Mestre Lendário", color: "secondary" });
    if (years?.includes("5–10")) badges.push({ label: "Mestre Experiente", color: "primary" });

    const narrative = answers.narrative_styles as string[] | undefined;
    if (narrative?.includes("Acolhedoras")) badges.push({ label: "Beginner Friendly", color: "accent" });
    if (narrative?.includes("Cinematográficas")) badges.push({ label: "Story-first", color: "primary" });
    if (narrative?.includes("Táticas")) badges.push({ label: "Tactical Master", color: "secondary" });

    const audience = answers.target_audience as string;
    if (audience === "Iniciantes") badges.push({ label: "Beginner Friendly", color: "accent" });

    const price = answers.budget_range as string;
    if (price?.includes("100+")) badges.push({ label: "Premium Table", color: "secondary" });
    if (price === "Gratuito") badges.push({ label: "Free Tables", color: "accent" });

    const formats = answers.mesa_formats as string[] | undefined;
    if (formats?.includes("One-shot")) badges.push({ label: "One-shot Ready", color: "primary" });
    if (formats?.includes("Mesa corporativa")) badges.push({ label: "Corporate Ready", color: "secondary" });

    const services = answers.special_services as string[] | undefined;
    if (services?.includes("Terapêutico")) badges.push({ label: "Therapeutic Ready", color: "accent" });
    if (services?.includes("Educacional")) badges.push({ label: "Educator", color: "primary" });
  }

  if (role === "loja") {
    const capacity = answers.capacity as number;
    if (capacity && capacity >= 50) badges.push({ label: "Alta Capacidade", color: "secondary" });

    const amenities = answers.amenities as string[] | undefined;
    if (amenities?.includes("Eventos temáticos")) badges.push({ label: "Friendly para Eventos", color: "primary" });
    if (amenities?.includes("Bar")) badges.push({ label: "Bar & Games", color: "accent" });
    if (amenities?.includes("Acessibilidade")) badges.push({ label: "Acessível", color: "primary" });

    const catalog = answers.game_catalog as string[] | undefined;
    if (catalog && catalog.length >= 5) badges.push({ label: "Curadoria Forte", color: "secondary" });

    const times = answers.availability_times as string[] | undefined;
    if (times?.includes("Noite") || times?.includes("Madrugada")) {
      badges.push({ label: "Operação Noturna", color: "accent" });
    }
  }

  if (role === "marca") {
    const obj = answers.brand_objective as string;
    if (obj === "Awareness") badges.push({ label: "Awareness Focus", color: "primary" });
    if (obj === "Comunidade") badges.push({ label: "Community Driven", color: "accent" });
    if (obj === "Ativação local") badges.push({ label: "Local Target", color: "secondary" });
    if (obj === "Vendas" || obj === "Leads") badges.push({ label: "High Intent", color: "secondary" });

    const budget = answers.brand_budget as string;
    if (budget?.includes("1.000+")) badges.push({ label: "Scale Player", color: "secondary" });
  }

  // Deduplicate by label
  const seen = new Set<string>();
  return badges.filter((b) => {
    if (seen.has(b.label)) return false;
    seen.add(b.label);
    return true;
  });
}

export function generateProfileSummary(role: RoleKey, answers: Record<string, unknown>): string {
  if (role === "jogador") {
    const parts: string[] = [];
    const fmt = answers.session_format_pref as string;
    if (fmt && fmt !== "Tanto faz") parts.push(fmt.toLowerCase() + "s");

    const styles = answers.play_styles as string[] | undefined;
    if (styles?.length) parts.push(styles.slice(0, 2).join(" e ").toLowerCase());

    const themes = answers.themes_liked as string[] | undefined;
    if (themes?.length) parts.push(themes.slice(0, 2).join(" e ").toLowerCase());

    const times = answers.availability_times as string[] | undefined;
    if (times?.length) parts.push("sessões " + times[0].toLowerCase());

    if (parts.length === 0) return "Seu perfil está pronto para descobrir as melhores mesas.";
    return `Seu perfil indica preferência por ${parts.join(", ")}.`;
  }

  if (role === "mestre") {
    const narrative = answers.narrative_styles as string[] | undefined;
    const audience = answers.target_audience as string;
    const parts: string[] = [];
    if (narrative?.length) parts.push("mesas " + narrative.slice(0, 2).join(" e ").toLowerCase());
    if (audience) parts.push("público " + audience.toLowerCase());
    if (parts.length === 0) return "Seu perfil está pronto para atrair jogadores mais aderentes.";
    return `Seu perfil combina com ${parts.join(", ")}.`;
  }

  if (role === "loja") {
    return "Sua casa está pronta para operar agendas, eventos e mesas com mais previsibilidade.";
  }

  return "Seu perfil já pode segmentar campanhas com mais precisão.";
}
