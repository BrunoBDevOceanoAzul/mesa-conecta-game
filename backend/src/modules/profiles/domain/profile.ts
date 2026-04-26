export interface ProfileCapabilities {
  canPlay: boolean;
  canGm: boolean;
  canManageStore: boolean;
  canManageBrand: boolean;
}

export interface ProfilePreferences {
  preferredSystems: string[];
  playStyles: string[];
  experienceLevel: string | null;
  preferredFormat: string | null;
  budgetRange: string | null;
}

export interface ProfileOnboarding {
  completed: boolean;
  step: number;
}

export interface GMStats {
  totalMesas: number;
  totalBookings: number;
  averageRating: string;
  totalReviews: number;
  reputationScore: string;
}

export interface PlayerStats {
  totalBookings: number;
  totalReviews: number;
}

export interface ProfileStats {
  gm: GMStats;
  player: PlayerStats;
  memberSince: Date | null;
  lastLoginAt: Date | null;
}

export interface ProfileProps {
  id: string;
  userId: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  slug: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  role: string | null;
  roles: string[];
  isPublic: boolean;
  capabilities: ProfileCapabilities;
  preferences: ProfilePreferences;
  onboarding: ProfileOnboarding;
  stats: ProfileStats;
  playerProfile: unknown;
  gmProfile: unknown;
}

export class Profile {
  constructor(private props: ProfileProps) {}

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get displayName(): string | null { return this.props.displayName; }
  get email(): string | null { return this.props.email; }
  get slug(): string | null { return this.props.slug; }
  get isPublic(): boolean { return this.props.isPublic; }
  get capabilities(): ProfileCapabilities { return this.props.capabilities; }

  /**
   * Retorna apenas dados seguros para o usuário autenticado (próprio perfil).
   * NÃO inclui dados sensíveis como email, phone, whatsapp.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      displayName: this.props.displayName,
      name: this.props.name,
      slug: this.props.slug,
      bio: this.props.bio,
      avatarUrl: this.props.avatarUrl,
      coverImageUrl: this.props.coverImageUrl,
      city: this.props.city,
      state: this.props.state,
      country: this.props.country,
      role: this.props.role,
      roles: this.props.roles,
      isPublic: this.props.isPublic,
      capabilities: this.props.capabilities,
      preferences: this.props.preferences,
      onboarding: this.props.onboarding,
      stats: this.props.stats,
    };
  }

  /**
   * Retorna dados públicos visíveis para qualquer usuário.
   * Remove dados pessoais e de contato.
   */
  toPublicJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      displayName: this.props.displayName,
      name: this.props.name,
      slug: this.props.slug,
      bio: this.props.bio,
      avatarUrl: this.props.avatarUrl,
      coverImageUrl: this.props.coverImageUrl,
      city: this.props.city,
      state: this.props.state,
      country: this.props.country,
      role: this.props.role,
      capabilities: {
        canPlay: this.props.capabilities.canPlay,
        canGm: this.props.capabilities.canGm,
        canManageStore: this.props.capabilities.canManageStore,
        canManageBrand: this.props.capabilities.canManageBrand,
      },
      preferences: {
        preferredSystems: this.props.preferences.preferredSystems,
        playStyles: this.props.preferences.playStyles,
        experienceLevel: this.props.preferences.experienceLevel,
        preferredFormat: this.props.preferences.preferredFormat,
      },
      stats: {
        gm: this.props.stats.gm,
        player: this.props.stats.player,
      },
    };
  }

  canBeViewedBy(viewerUserId?: string): boolean {
    if (this.props.isPublic) return true;
    if (viewerUserId && this.props.userId === viewerUserId) return true;
    return false;
  }
}
