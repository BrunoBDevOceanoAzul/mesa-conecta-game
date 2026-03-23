/**
 * Onboarding step configurations for each role.
 * Each step defines its UI type, DB field, title, subtitle, and options.
 */

export type StepType =
  | "city-autocomplete"
  | "systems-search"
  | "cards-single"
  | "cards-multi"
  | "chips-multi"
  | "days-times"
  | "slider"
  | "stepper"
  | "toggles"
  | "text-optional"
  | "bio-avatar";

export interface StepOption {
  label: string;
  icon?: string; // lucide icon name
  description?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  microcopy?: string;
  type: StepType;
  field: string;
  options?: StepOption[];
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  /** Only show this step when the given field has one of the listed values */
  conditionalOn?: { field: string; values: string[] };
}

// ─── JOGADOR ───────────────────────────────────────────
export const playerSteps: OnboardingStep[] = [
  {
    id: "player-bio",
    title: "Sua identidade na comunidade",
    subtitle: "Adicione uma foto e conte um pouco sobre você",
    microcopy: "Sua bio aparece no seu perfil e ajuda outros jogadores a te conhecer.",
    type: "bio-avatar",
    field: "bio",
    required: false,
  },
  {
    id: "player-format",
    title: "Como você prefere jogar?",
    subtitle: "A HIVIUM conecta experiências online, presenciais e híbridas.",
    microcopy: "Vamos personalizar sua jornada com base no formato que faz mais sentido para você.",
    type: "cards-single",
    field: "preferred_format",
    options: [
      { label: "Online", icon: "Monitor", description: "De qualquer lugar, sem limite geográfico" },
      { label: "Presencial", icon: "MapPin", description: "Nada supera estar junto na mesa" },
      { label: "Híbrido", icon: "Blend", description: "O melhor dos dois mundos" },
    ],
    required: true,
  },
  {
    id: "player-city",
    title: "Em que cidade ou região você quer viver essa experiência?",
    subtitle: "Usamos isso para mostrar mesas presenciais próximas de você",
    microcopy: "Você também verá opções online quando fizerem sentido. Pode ajustar depois.",
    type: "city-autocomplete",
    field: "city",
    required: false,
    conditionalOn: { field: "preferred_format", values: ["Presencial", "Híbrido"] },
  },
  {
    id: "player-availability",
    title: "Quando você costuma conseguir jogar?",
    subtitle: "Isso nos ajuda a sugerir mesas nos melhores horários",
    microcopy: "Sem pressa. Isso nos ajuda a mostrar mesas mais aderentes.",
    type: "days-times",
    field: "availability",
    required: false,
  },
  {
    id: "player-systems",
    title: "Quais universos e sistemas mais te chamam?",
    subtitle: "Busque entre 600+ sistemas de RPG",
    microcopy: "Quanto melhor entendermos seu perfil, melhores serão suas recomendações.",
    type: "systems-search",
    field: "preferred_systems",
    required: false,
  },
  {
    id: "player-experience",
    title: "Qual é sua experiência com RPG?",
    subtitle: "Não existe resposta errada aqui",
    type: "cards-single",
    field: "experience_level",
    options: [
      { label: "Nunca joguei", icon: "Sparkles", description: "Tudo novo — e tá tudo bem" },
      { label: "Já joguei algumas vezes", icon: "Dice3", description: "Conheço o básico" },
      { label: "Experiente", icon: "Sword", description: "Jogo com frequência" },
      { label: "Veterano", icon: "Crown", description: "RPG é parte da minha vida" },
    ],
    required: true,
  },
  {
    id: "player-styles",
    title: "Que tipo de experiência você procura?",
    subtitle: "Selecione quantas quiser",
    microcopy: "Seu estilo define as recomendações que você recebe.",
    type: "cards-multi",
    field: "play_styles",
    options: [
      { label: "Interpretação", icon: "Theater" },
      { label: "Combate", icon: "Swords" },
      { label: "Investigação", icon: "Search" },
      { label: "Terror", icon: "Ghost" },
      { label: "Fantasia épica", icon: "Mountain" },
      { label: "Narrativa casual", icon: "BookOpen" },
      { label: "Estratégia", icon: "Brain" },
      { label: "Humor", icon: "Laugh" },
      { label: "Drama", icon: "Heart" },
    ],
    required: false,
  },
  {
    id: "player-budget",
    title: "Qual faixa faz sentido para você por sessão?",
    subtitle: "Sem julgamento — cada jornada tem seu ritmo",
    type: "cards-single",
    field: "budget_range",
    options: [
      { label: "Até R$20", description: "Acessível e leve" },
      { label: "R$20–40", description: "Equilíbrio ideal" },
      { label: "R$40–70", description: "Experiência completa" },
      { label: "R$70+", description: "Premium e imersivo" },
      { label: "Flexível", description: "Depende da mesa" },
    ],
    required: false,
  },
  {
    id: "player-session-format",
    title: "Que formato de mesa combina mais com você?",
    subtitle: "One-shot, campanha ou tanto faz?",
    type: "cards-single",
    field: "session_format_pref",
    options: [
      { label: "One-shot", icon: "Zap", description: "Uma sessão completa" },
      { label: "Campanha", icon: "Map", description: "Histórias longas e contínuas" },
      { label: "Tanto faz", icon: "Shuffle", description: "Ambos me agradam" },
    ],
    required: false,
  },
  {
    id: "player-themes",
    title: "Que temas te prendem mais?",
    subtitle: "Selecione seus favoritos",
    type: "chips-multi",
    field: "themes_liked",
    options: [
      { label: "Fantasia" },
      { label: "Horror" },
      { label: "Ficção científica" },
      { label: "Mistério" },
      { label: "Medieval" },
      { label: "Urbano" },
      { label: "Mitologia" },
      { label: "Investigação" },
      { label: "Político" },
      { label: "Sobrenatural" },
    ],
    required: false,
  },
  {
    id: "player-avoid",
    title: "Existe algo que você prefere evitar?",
    subtitle: "Respeitamos completamente seus limites",
    microcopy: "Essa informação é privada e ajuda mestres a criar ambientes mais seguros.",
    type: "chips-multi",
    field: "themes_avoided",
    options: [
      { label: "Violência gráfica" },
      { label: "Horror extremo" },
      { label: "Temas políticos" },
      { label: "Romance/intimidade" },
      { label: "Abuso/tortura" },
      { label: "Fobias comuns" },
      { label: "Temas religiosos" },
      { label: "Nenhuma restrição" },
    ],
    placeholder: "Algo mais que gostaria de mencionar? (opcional)",
    required: false,
  },
];

// ─── MESTRE ───────────────────────────────────────────
export const gmSteps: OnboardingStep[] = [
  {
    id: "gm-bio",
    title: "Sua identidade como mestre",
    subtitle: "Uma foto e uma frase que diga quem você é na mesa",
    microcopy: "Jogadores veem isso ao explorar mesas. Cause uma boa primeira impressão.",
    type: "bio-avatar",
    field: "bio",
    required: false,
  },
  {
    id: "gm-format",
    title: "Como você prefere abrir suas mesas?",
    subtitle: "A HIVIUM conecta experiências online, presenciais e híbridas.",
    microcopy: "Vamos adaptar a plataforma ao seu estilo de operação.",
    type: "cards-single",
    field: "preferred_format",
    options: [
      { label: "Online", icon: "Monitor", description: "Mestrar de qualquer lugar" },
      { label: "Presencial", icon: "MapPin", description: "Mesas com presença física" },
      { label: "Híbrido", icon: "Blend", description: "Flexibilidade total" },
    ],
    required: true,
  },
  {
    id: "gm-city",
    title: "Em que cidade ou região você atua?",
    subtitle: "Jogadores próximos encontram você mais facilmente",
    microcopy: "Sua presença online também será visível. Pode ajustar depois.",
    type: "city-autocomplete",
    field: "city",
    required: false,
    conditionalOn: { field: "preferred_format", values: ["Presencial", "Híbrido"] },
  },
  {
    id: "gm-systems",
    title: "Quais sistemas você domina com segurança?",
    subtitle: "Busque entre 600+ sistemas",
    microcopy: "Seus sistemas aparecem no seu perfil público.",
    type: "systems-search",
    field: "preferred_systems",
    required: false,
  },
  {
    id: "gm-narrative",
    title: "Como suas mesas costumam ser lembradas?",
    subtitle: "Seu estilo atrai os jogadores certos",
    type: "cards-multi",
    field: "narrative_styles",
    options: [
      { label: "Cinematográficas", icon: "Film" },
      { label: "Táticas", icon: "Target" },
      { label: "Acolhedoras", icon: "Heart" },
      { label: "Intensas", icon: "Flame" },
      { label: "Investigativas", icon: "Search" },
      { label: "Improvisadas", icon: "Shuffle" },
      { label: "Profundas em roleplay", icon: "Theater" },
      { label: "Rápidas e acessíveis", icon: "Zap" },
    ],
    required: false,
  },
  {
    id: "gm-experience",
    title: "Há quanto tempo você mestra?",
    subtitle: "Experiência é um diferencial valioso",
    type: "cards-single",
    field: "years_mastering",
    options: [
      { label: "Menos de 1 ano", description: "Começando a jornada" },
      { label: "1–3 anos", description: "Construindo repertório" },
      { label: "3–5 anos", description: "Mestre consolidado" },
      { label: "5–10 anos", description: "Referência na comunidade" },
      { label: "10+ anos", description: "Veterano lendário" },
    ],
    required: true,
  },
  {
    id: "gm-availability",
    title: "Quando você costuma abrir mesas?",
    subtitle: "Jogadores buscam por horários compatíveis",
    type: "days-times",
    field: "availability",
    required: false,
  },
  {
    id: "gm-price",
    title: "Qual é sua faixa usual por sessão?",
    subtitle: "Transparência gera confiança",
    type: "cards-single",
    field: "budget_range",
    options: [
      { label: "Até R$25" },
      { label: "R$25–40" },
      { label: "R$40–60" },
      { label: "R$60–100" },
      { label: "R$100+" },
      { label: "Gratuito" },
    ],
    required: false,
  },
  {
    id: "gm-max-players",
    title: "Qual composição funciona melhor para você?",
    subtitle: "Número máximo de jogadores por mesa",
    type: "stepper",
    field: "max_players",
    min: 2,
    max: 10,
    required: false,
  },
  {
    id: "gm-audience",
    title: "Você prefere conduzir mesas para quem?",
    subtitle: "Seu público ideal",
    type: "cards-single",
    field: "target_audience",
    options: [
      { label: "Iniciantes", icon: "Sparkles", description: "Primeiras aventuras" },
      { label: "Intermediários", icon: "Dice3", description: "Já conhecem o caminho" },
      { label: "Avançados", icon: "Crown", description: "Buscam profundidade" },
      { label: "Todos os níveis", icon: "Users", description: "Versátil e adaptável" },
    ],
    required: false,
  },
  {
    id: "gm-formats",
    title: "Que tipos de mesa você oferece?",
    subtitle: "Selecione todos que se aplicam",
    type: "chips-multi",
    field: "mesa_formats",
    options: [
      { label: "One-shot" },
      { label: "Campanha" },
      { label: "Evento" },
      { label: "Mesa corporativa" },
      { label: "Educacional" },
      { label: "Terapêutica" },
      { label: "Introdutória" },
    ],
    required: false,
  },
  {
    id: "gm-special",
    title: "Você também atua em formatos especiais?",
    subtitle: "Serviços que agregam ao seu perfil",
    type: "toggles",
    field: "special_services",
    options: [
      { label: "Corporativo", description: "Team building e dinâmicas" },
      { label: "Terapêutico", description: "RPG como ferramenta de cuidado" },
      { label: "Educacional", description: "Ensino e pedagogia lúdica" },
      { label: "Eventos privados", description: "Aniversários, festas, etc." },
    ],
    required: false,
  },
];

// ─── LOJA / LUDERIA ──────────────────────────────────
export const storeSteps: OnboardingStep[] = [
  {
    id: "store-bio",
    title: "A identidade da sua casa",
    subtitle: "Uma foto e uma frase que represente sua luderia",
    microcopy: "Isso aparece no seu perfil público e ajuda jogadores a te encontrar.",
    type: "bio-avatar",
    field: "bio",
    required: false,
  },
  {
    id: "store-format",
    title: "Como sua operação acontece?",
    subtitle: "A HIVIUM conecta experiências presenciais, híbridas e online.",
    microcopy: "Vamos adaptar a plataforma à realidade da sua casa.",
    type: "cards-single",
    field: "preferred_format",
    options: [
      { label: "Presencial", icon: "MapPin", description: "Operação 100% local" },
      { label: "Híbrido", icon: "Blend", description: "Local + experiências online" },
      { label: "Online", icon: "Monitor", description: "Também quero explorar o digital" },
    ],
    required: true,
  },
  {
    id: "store-city",
    title: "Onde sua casa está localizada?",
    subtitle: "Jogadores e mestres encontram você no mapa",
    microcopy: "Pode ajustar depois.",
    type: "city-autocomplete",
    field: "city",
    required: true,
    conditionalOn: { field: "preferred_format", values: ["Presencial", "Híbrido"] },
  },
  {
    id: "store-capacity",
    title: "Quantas pessoas sua casa comporta bem?",
    subtitle: "Capacidade total do espaço",
    type: "stepper",
    field: "capacity",
    min: 5,
    max: 200,
    required: true,
  },
  {
    id: "store-tables",
    title: "Quantas mesas podem rodar ao mesmo tempo?",
    subtitle: "Mesas simultâneas em operação",
    type: "stepper",
    field: "simultaneous_tables",
    min: 1,
    max: 20,
    required: true,
  },
  {
    id: "store-days",
    title: "Quando sua casa está pronta para receber mesas?",
    subtitle: "Dias e horários de operação",
    type: "days-times",
    field: "availability",
    required: false,
  },
  {
    id: "store-catalog",
    title: "O que melhor representa sua curadoria?",
    subtitle: "Busque entre 600+ sistemas de RPG",
    type: "systems-search",
    field: "game_catalog",
    required: false,
  },
  {
    id: "store-ticket",
    title: "Qual ticket médio faz sentido para a casa?",
    subtitle: "Por pessoa, por sessão",
    type: "cards-single",
    field: "ticket_avg",
    options: [
      { label: "Até R$20" },
      { label: "R$20–40" },
      { label: "R$40–60" },
      { label: "R$60+" },
      { label: "Flexível" },
    ],
    required: false,
  },
  {
    id: "store-amenities",
    title: "Que estrutura você oferece?",
    subtitle: "Detalhes que fazem a diferença",
    type: "chips-multi",
    field: "amenities",
    options: [
      { label: "Salas reservadas" },
      { label: "Mesas amplas" },
      { label: "Cafeteria" },
      { label: "Bar" },
      { label: "Loja física" },
      { label: "Acessibilidade" },
      { label: "Ar-condicionado" },
      { label: "Internet boa" },
      { label: "Eventos temáticos" },
      { label: "Grupos grandes" },
    ],
    required: false,
  },
];

// ─── MARCA ───────────────────────────────────────────
export const brandSteps: OnboardingStep[] = [
  {
    id: "brand-bio",
    title: "A cara da sua marca",
    subtitle: "Logo e uma frase que posicione sua marca no ecossistema",
    microcopy: "Isso aparece nas suas campanhas e posts patrocinados.",
    type: "bio-avatar",
    field: "bio",
    required: false,
  },
    id: "brand-category",
    title: "Que tipo de marca é a sua?",
    subtitle: "Isso define como você aparece na plataforma",
    type: "cards-single",
    field: "brand_category",
    options: [
      { label: "Editora", icon: "BookOpen" },
      { label: "Loja geek", icon: "ShoppingBag" },
      { label: "Bebida/Alimento", icon: "Coffee" },
      { label: "Educação", icon: "GraduationCap" },
      { label: "Tecnologia", icon: "Cpu" },
      { label: "Entretenimento", icon: "Gamepad2" },
      { label: "Outro", icon: "Boxes" },
    ],
    required: true,
  },
  {
    id: "brand-objective",
    title: "O que você quer gerar aqui?",
    subtitle: "Seu objetivo principal na HIVIUM",
    type: "cards-single",
    field: "brand_objective",
    options: [
      { label: "Awareness", description: "Ser visto e lembrado" },
      { label: "Tráfego", description: "Levar pessoas ao seu site" },
      { label: "Leads", description: "Captar contatos qualificados" },
      { label: "Vendas", description: "Converter diretamente" },
      { label: "Comunidade", description: "Presença entre jogadores" },
      { label: "Ativação local", description: "Impactar uma região" },
    ],
    required: true,
  },
  {
    id: "brand-audience",
    title: "Quem você quer alcançar?",
    subtitle: "Selecione seus públicos-alvo",
    type: "chips-multi",
    field: "brand_audience",
    options: [
      { label: "Jogadores iniciantes" },
      { label: "Jogadores veteranos" },
      { label: "Mestres" },
      { label: "Lojas/Luderias" },
      { label: "Público local" },
      { label: "Nichos por sistema" },
    ],
    required: false,
  },
  {
    id: "brand-budget",
    title: "Qual faixa mensal você pretende investir?",
    subtitle: "Planejamento ajuda a otimizar resultados",
    type: "cards-single",
    field: "brand_budget",
    options: [
      { label: "Até R$200/mês", description: "Exploratório" },
      { label: "R$200–500/mês", description: "Consistente" },
      { label: "R$500–1.000/mês", description: "Acelerado" },
      { label: "R$1.000+/mês", description: "Escala total" },
    ],
    required: false,
  },
];

export type RoleKey = "jogador" | "mestre" | "loja" | "marca";

export const stepsMap: Record<RoleKey, OnboardingStep[]> = {
  jogador: playerSteps,
  mestre: gmSteps,
  loja: storeSteps,
  marca: brandSteps,
};

export const roleInfo: Record<RoleKey, { title: string; description: string; icon: string }> = {
  jogador: {
    title: "Jogador",
    description: "Descubra mesas online, presenciais ou híbridas que combinam com seu estilo.",
    icon: "Dice5",
  },
  mestre: {
    title: "Mestre",
    description: "Organize mesas, atraia jogadores certos e cresça — online ou presencialmente.",
    icon: "BookOpen",
  },
  loja: {
    title: "Loja / Luderia",
    description: "Gerencie sua agenda, ocupe suas mesas e organize eventos com clareza.",
    icon: "Store",
  },
  marca: {
    title: "Marca",
    description: "Alcance comunidades relevantes com campanhas mais inteligentes.",
    icon: "Megaphone",
  },
};
