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

  toJSON(): ProfileProps {
    return { ...this.props };
  }

  canBeViewedBy(viewerUserId?: string): boolean {
    if (this.props.isPublic) return true;
    if (viewerUserId && this.props.userId === viewerUserId) return true;
    return false;
  }
}
