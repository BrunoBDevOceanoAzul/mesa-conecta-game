import type { RoleKey } from "@/lib/onboarding-steps";

export interface RoleTheme {
  /** HSL accent for ambient glow */
  glowHsl: string;
  secondaryGlowHsl: string;
  /** Welcome screen copy */
  welcomeTitle: [string, string]; // [line1, gradient line2]
  welcomeSubtitle: string;
  welcomeFooter: string;
  welcomeCta: string;
  /** Icon name from lucide */
  iconName: string;
  /** Transition screen copy */
  transitionStart: { headline: string; subtext: string };
  transitionReview: { headline: string; subtext: string };
  transitionMapped: { headline: string; subtext: string };
  /** Mapped screen copy */
  mappedTitle: string;
  mappedSubtitle: string;
  mappedCta: string;
}

export const roleThemes: Record<RoleKey, RoleTheme> = {
  jogador: {
    glowHsl: "hsl(172 55% 42%)",
    secondaryGlowHsl: "hsl(270 55% 50%)",
    iconName: "Dice5",
    welcomeTitle: ["Descubra mesas que", "combinam com você"],
    welcomeSubtitle: "Conte como você joga e a HIVIUM encontra sessões online, presenciais e híbridas sob medida para o seu estilo.",
    welcomeFooter: "~3 minutos · Seu perfil evolui com você",
    welcomeCta: "Começar mapeamento",
    transitionStart: {
      headline: "Vamos calibrar seu radar",
      subtext: "Em poucos passos, você recebe recomendações de mesas que fazem sentido para o seu momento.",
    },
    transitionReview: {
      headline: "Quase lá, aventureiro",
      subtext: "Revise suas escolhas antes de calibrar o perfil.",
    },
    transitionMapped: {
      headline: "Seu radar está ativo",
      subtext: "A HIVIUM já sabe o que procurar para você.",
    },
    mappedTitle: "Perfil de jogador calibrado",
    mappedSubtitle: "Agora a HIVIUM recomenda mesas, mestres e campanhas que combinam com seu estilo, horário e região.",
    mappedCta: "Explorar mesas",
  },

  mestre: {
    glowHsl: "hsl(272 60% 55%)",
    secondaryGlowHsl: "hsl(38 88% 55%)",
    iconName: "BookOpen",
    welcomeTitle: ["Monte sua operação e", "atraia os jogadores certos"],
    welcomeSubtitle: "Defina seu estilo de narrativa, formato e público. A HIVIUM faz o match entre você e quem procura exatamente o que você oferece.",
    welcomeFooter: "~4 minutos · Seu perfil profissional começa aqui",
    welcomeCta: "Configurar meu perfil",
    transitionStart: {
      headline: "Vamos montar seu perfil de mestre",
      subtext: "Cada detalhe ajuda jogadores a encontrarem sua mesa com mais confiança.",
    },
    transitionReview: {
      headline: "Quase lá, mestre",
      subtext: "Quanto melhor a calibração, mais aderentes serão seus jogadores.",
    },
    transitionMapped: {
      headline: "Seu perfil profissional está pronto",
      subtext: "A HIVIUM já pode conectar você aos jogadores certos.",
    },
    mappedTitle: "Perfil de mestre calibrado",
    mappedSubtitle: "Jogadores agora encontram você pelo sistema, estilo narrativo, formato e faixa de preço — tudo alinhado.",
    mappedCta: "Ir para o dashboard",
  },

  loja: {
    glowHsl: "hsl(12 70% 55%)",
    secondaryGlowHsl: "hsl(38 88% 55%)",
    iconName: "Store",
    welcomeTitle: ["Coloque sua luderia", "no mapa da comunidade"],
    welcomeSubtitle: "Configure seu espaço, defina horários e comece a receber mestres e jogadores que combinam com a sua casa.",
    welcomeFooter: "~4 minutos · Sua agenda começa a ser montada agora",
    welcomeCta: "Configurar minha luderia",
    transitionStart: {
      headline: "Vamos preparar sua casa",
      subtext: "Capacidade, horários e estrutura — tudo o que a comunidade precisa saber.",
    },
    transitionReview: {
      headline: "Quase lá",
      subtext: "Revise os dados antes de publicar seu espaço.",
    },
    transitionMapped: {
      headline: "Sua luderia está no mapa",
      subtext: "Mestres e jogadores já podem encontrar e reservar sua casa.",
    },
    mappedTitle: "Luderia configurada",
    mappedSubtitle: "Seu espaço agora aparece nas buscas, com agenda, capacidade e estrutura visíveis para a comunidade.",
    mappedCta: "Ir para o dashboard",
  },

  marca: {
    glowHsl: "hsl(220 60% 50%)",
    secondaryGlowHsl: "hsl(272 55% 50%)",
    iconName: "Megaphone",
    welcomeTitle: ["Alcance comunidades", "que importam de verdade"],
    welcomeSubtitle: "Defina seu objetivo, público e orçamento. A HIVIUM conecta sua marca a milhares de jogadores, mestres e luderias engajados.",
    welcomeFooter: "~2 minutos · Campanha inteligente começa com contexto",
    welcomeCta: "Configurar minha marca",
    transitionStart: {
      headline: "Vamos mapear sua estratégia",
      subtext: "Cada dado ajuda a segmentar sua campanha com mais precisão.",
    },
    transitionReview: {
      headline: "Quase lá",
      subtext: "Revise antes de ativar seu posicionamento.",
    },
    transitionMapped: {
      headline: "Sua marca está posicionada",
      subtext: "A HIVIUM já pode segmentar campanhas para o seu público ideal.",
    },
    mappedTitle: "Marca configurada",
    mappedSubtitle: "Agora você pode criar campanhas segmentadas por sistema, região, nível de experiência e interesse.",
    mappedCta: "Ir para o dashboard",
  },
};
