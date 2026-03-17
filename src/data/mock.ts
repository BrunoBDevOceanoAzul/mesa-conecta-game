export type UserRole = 'player' | 'gm' | 'store' | 'brand';

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
