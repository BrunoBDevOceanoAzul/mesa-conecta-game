export type UserRole = 'player' | 'gm' | 'store' | 'brand';

export interface MockUser {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  city: string;
  bio: string;
}

export interface MockTable {
  id: string;
  title: string;
  description: string;
  system: string;
  sessionType: 'one-shot' | 'campanha' | 'evento';
  format: 'presencial' | 'online' | 'híbrido';
  city: string;
  venue: string;
  minPrice: number;
  maxPrice: number;
  seatsTotal: number;
  seatsAvailable: number;
  gmId: string;
  gmName: string;
  gmAvatar: string;
  storeId?: string;
  startAt: string;
  status: 'aberta' | 'lotada' | 'encerrada';
  matchScore: number;
  tags: string[];
  imageUrl?: string;
}

export interface MockPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  sponsored: boolean;
  createdAt: string;
  likes: number;
}

export interface CRMLead {
  id: string;
  playerName: string;
  playerAvatar: string;
  stage: 'novo' | 'interessado' | 'confirmado' | 'recorrente';
  tags: string[];
  notes: string;
  sourceTable: string;
  lastContact: string;
}

export interface PricingPlan {
  name: string;
  role: UserRole;
  price: number;
  period: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

export const SYSTEMS = ['D&D 5e', 'Tormenta 20', 'Call of Cthulhu', 'Pathfinder 2e', 'Vampiro: A Máscara', 'GURPS', 'Ordem Paranormal', 'Savage Worlds', 'Blades in the Dark', 'Mork Borg'];

export const PLAY_STYLES = ['Narrativo', 'Tático', 'Sandbox', 'Investigativo', 'Horror', 'Comédia', 'Hack & Slash', 'Roleplay Pesado'];

export const mockGMs: MockUser[] = [
  { id: 'gm1', name: 'Rafael "Arkanos" Silva', role: 'gm', avatar: '', city: 'São Paulo', bio: 'Mestre há 12 anos. Especialista em campanhas épicas de D&D e Tormenta 20.' },
  { id: 'gm2', name: 'Camila Stormbringer', role: 'gm', avatar: '', city: 'Rio de Janeiro', bio: 'Narrativa imersiva com foco em horror e investigação. Call of Cthulhu é minha paixão.' },
  { id: 'gm3', name: 'Diego "Mestre das Sombras"', role: 'gm', avatar: '', city: 'Belo Horizonte', bio: 'Vampiro, Ordem Paranormal e tudo que envolve mistério. Sessões cinematográficas.' },
  { id: 'gm4', name: 'Juliana Nightweaver', role: 'gm', avatar: '', city: 'Curitiba', bio: 'Foco em iniciantes! Torno a primeira sessão de RPG inesquecível.' },
];

export const mockStores = [
  { id: 'store1', name: 'Taverna do Dragão', city: 'São Paulo', capacity: 40, tablesCount: 8, address: 'R. Augusta, 1200' },
  { id: 'store2', name: 'Luderia Nexus', city: 'Rio de Janeiro', capacity: 30, tablesCount: 6, address: 'R. Visconde de Pirajá, 500' },
  { id: 'store3', name: 'Dungeon Board Café', city: 'Belo Horizonte', capacity: 25, tablesCount: 5, address: 'R. da Bahia, 800' },
];

export const mockTables: MockTable[] = [
  {
    id: 't1', title: 'A Maldição de Strahd', description: 'Campanha clássica de horror gótico em Barovia. Sessão 0 + 12 sessões quinzenais.', system: 'D&D 5e', sessionType: 'campanha', format: 'presencial', city: 'São Paulo', venue: 'Taverna do Dragão', minPrice: 40, maxPrice: 60, seatsTotal: 5, seatsAvailable: 2, gmId: 'gm1', gmName: 'Rafael "Arkanos" Silva', gmAvatar: '', startAt: '2026-04-05T19:00:00', status: 'aberta', matchScore: 94, tags: ['horror', 'campanha longa', 'presencial'], imageUrl: '',
  },
  {
    id: 't2', title: 'One-Shot: O Chamado de Cthulhu', description: 'Sessão única de investigação lovecraftiana. Personagens pré-gerados. Ideal para iniciantes no sistema.', system: 'Call of Cthulhu', sessionType: 'one-shot', format: 'online', city: 'Rio de Janeiro', venue: 'Online (Discord)', minPrice: 25, maxPrice: 25, seatsTotal: 4, seatsAvailable: 3, gmId: 'gm2', gmName: 'Camila Stormbringer', gmAvatar: '', startAt: '2026-03-28T20:00:00', status: 'aberta', matchScore: 87, tags: ['horror', 'one-shot', 'iniciantes'],
  },
  {
    id: 't3', title: 'Noite de Vampiro', description: 'Crônicas vampíricas em São Paulo moderna. Intriga, política e sangue.', system: 'Vampiro: A Máscara', sessionType: 'campanha', format: 'presencial', city: 'Belo Horizonte', venue: 'Dungeon Board Café', minPrice: 35, maxPrice: 50, seatsTotal: 6, seatsAvailable: 4, gmId: 'gm3', gmName: 'Diego "Mestre das Sombras"', gmAvatar: '', startAt: '2026-04-02T20:00:00', status: 'aberta', matchScore: 78, tags: ['intriga', 'campanha', 'presencial'],
  },
  {
    id: 't4', title: 'RPG para Iniciantes: Tormenta 20', description: 'Nunca jogou RPG? Essa mesa é pra você! Tudo explicado com calma e diversão.', system: 'Tormenta 20', sessionType: 'one-shot', format: 'presencial', city: 'Curitiba', venue: 'Luderia Curitibana', minPrice: 20, maxPrice: 20, seatsTotal: 5, seatsAvailable: 5, gmId: 'gm4', gmName: 'Juliana Nightweaver', gmAvatar: '', startAt: '2026-04-10T14:00:00', status: 'aberta', matchScore: 92, tags: ['iniciantes', 'one-shot', 'nacional'],
  },
  {
    id: 't5', title: 'Ordem Paranormal: Arquivo Morto', description: 'Investigação sobrenatural baseada no universo de Ordem Paranormal RPG.', system: 'Ordem Paranormal', sessionType: 'one-shot', format: 'híbrido', city: 'São Paulo', venue: 'Taverna do Dragão', minPrice: 30, maxPrice: 30, seatsTotal: 5, seatsAvailable: 1, gmId: 'gm1', gmName: 'Rafael "Arkanos" Silva', gmAvatar: '', startAt: '2026-03-30T18:00:00', status: 'aberta', matchScore: 85, tags: ['horror', 'nacional', 'híbrido'],
  },
  {
    id: 't6', title: 'Blades in the Dark: Gangue Noturna', description: 'Heists e crime em uma cidade industrial sombria. Sistema narrativo, sem mapas.', system: 'Blades in the Dark', sessionType: 'campanha', format: 'online', city: 'Porto Alegre', venue: 'Online (Roll20)', minPrice: 45, maxPrice: 45, seatsTotal: 4, seatsAvailable: 2, gmId: 'gm2', gmName: 'Camila Stormbringer', gmAvatar: '', startAt: '2026-04-08T21:00:00', status: 'aberta', matchScore: 71, tags: ['narrativo', 'crime', 'online'],
  },
];

export const mockPosts: MockPost[] = [
  { id: 'p1', authorId: 'gm1', authorName: 'Rafael "Arkanos" Silva', authorRole: 'gm', authorAvatar: '', content: '🎲 Novas vagas abertas para a Maldição de Strahd! Sessão presencial na Taverna do Dragão, São Paulo. Quem topa enfrentar o Conde?', sponsored: false, createdAt: '2026-03-16T10:00:00', likes: 24 },
  { id: 'p2', authorId: 'store1', authorName: 'Taverna do Dragão', authorRole: 'store', authorAvatar: '', content: '🐉 Programação de março: 12 mesas confirmadas! RPG todo sábado e board games às quartas. Reservem pelo MesaNexo!', imageUrl: '', sponsored: false, createdAt: '2026-03-15T14:00:00', likes: 42 },
  { id: 'p3', authorId: 'brand1', authorName: 'Galápagos Jogos', authorRole: 'brand', authorAvatar: '', content: '📦 Lançamento exclusivo: Tormenta 20 — Edição do Mestre! Disponível nas luderias parceiras do MesaNexo. Garanta o seu com desconto de lançamento.', sponsored: true, createdAt: '2026-03-14T09:00:00', likes: 89 },
  { id: 'p4', authorId: 'gm4', authorName: 'Juliana Nightweaver', authorRole: 'gm', authorAvatar: '', content: '✨ Dica para mestres iniciantes: a primeira sessão não precisa ser perfeita, precisa ser divertida. O resto vem com a prática. Quem concorda?', sponsored: false, createdAt: '2026-03-13T18:00:00', likes: 67 },
  { id: 'p5', authorId: 'store2', authorName: 'Luderia Nexus', authorRole: 'store', authorAvatar: '', content: '🎯 Evento especial: Noite de One-Shots toda sexta de abril! 5 mesas simultâneas, 5 sistemas diferentes. Ingressos pelo MesaNexo.', sponsored: true, createdAt: '2026-03-12T11:00:00', likes: 35 },
];

export const mockCRMLeads: CRMLead[] = [
  { id: 'l1', playerName: 'Lucas Martins', playerAvatar: '', stage: 'confirmado', tags: ['D&D', 'presencial', 'recorrente'], notes: 'Jogador fixo da campanha de Strahd', sourceTable: 'A Maldição de Strahd', lastContact: '2026-03-15' },
  { id: 'l2', playerName: 'Ana Clara', playerAvatar: '', stage: 'interessado', tags: ['iniciante', 'online'], notes: 'Perguntou sobre vagas no Discord', sourceTable: 'One-Shot: O Chamado de Cthulhu', lastContact: '2026-03-14' },
  { id: 'l3', playerName: 'Pedro Henrique', playerAvatar: '', stage: 'novo', tags: ['Tormenta', 'presencial'], notes: 'Veio pela landing page', sourceTable: '', lastContact: '2026-03-16' },
  { id: 'l4', playerName: 'Marina Silva', playerAvatar: '', stage: 'recorrente', tags: ['VtM', 'narrativo', 'premium'], notes: 'Já fez 8 sessões. Interesse em campanha longa.', sourceTable: 'Noite de Vampiro', lastContact: '2026-03-10' },
];

export const pricingPlans: PricingPlan[] = [
  { name: 'Passe Aventureiro', role: 'player', price: 24.90, period: '/mês', features: ['Até 2 reservas/mês', 'Matchmaking inteligente', 'Histórico de mesas', 'Perfil de compatibilidade'] },
  { name: 'Passe Guilda', role: 'player', price: 39.90, period: '/mês', features: ['Até 5 reservas/mês', 'Matchmaking inteligente', 'Prioridade em mesas lotadas', 'Badge exclusiva', 'Acesso antecipado a eventos'], highlight: true },
  { name: 'Mestre Pro', role: 'gm', price: 29.90, period: '/mês', features: ['Perfil profissional', 'Mini CRM integrado', 'Agenda e reservas', 'Analytics básico', 'Até 3 mesas ativas'] },
  { name: 'Mestre Pro+', role: 'gm', price: 59.90, period: '/mês', features: ['Tudo do Pro', 'Mesas ilimitadas', 'CRM avançado com tags', 'Analytics completo', '2 impulsionamentos/mês', 'Suporte prioritário'], highlight: true, badge: 'Popular' },
  { name: 'Loja Base', role: 'store', price: 79.90, period: '/mês', features: ['Até 4 mesas/mês', 'Perfil da luderia', 'Agenda pública', 'Gestão de reservas'] },
  { name: 'Loja Growth', role: 'store', price: 149.90, period: '/mês', features: ['Até 12 mesas/mês', 'Feed destacado', 'Analytics avançado', 'Suporte dedicado', '3 impulsionamentos/mês'], highlight: true, badge: 'Recomendado' },
  { name: 'Brand Slot', role: 'brand', price: 199.90, period: '/mês', features: ['Posts patrocinados no feed', 'Segmentação por perfil', 'Dashboard de campanha', 'Relatório mensal', 'Gerente de conta'] },
];

export const creditPackages = [
  { credits: 20, price: 20, label: 'Pacote Starter' },
  { credits: 55, price: 50, label: 'Pacote Growth', badge: 'Mais popular' },
  { credits: 120, price: 100, label: 'Pacote Pro', badge: 'Melhor custo' },
];
