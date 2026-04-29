import { Profile } from "./profile.js";

export interface FindProfileByUserIdInput {
  userId: string;
}

export interface FindProfileByIdInput {
  id: string;
}

export interface FindProfileBySlugInput {
  slug: string;
}

export interface UpdateProfileInput {
  userId: string;
  displayName?: string;
  bio?: string;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  instagramHandle?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  preferredSystems?: string[];
  playStyles?: string[];
  experienceLevel?: string;
  preferredFormat?: string;
  canPlay?: boolean;
  canGm?: boolean;
  canManageStore?: boolean;
  canManageBrand?: boolean;
}

export interface ProfileRepository {
  findByUserId(input: FindProfileByUserIdInput): Promise<Profile | null>;
  findById(input: FindProfileByIdInput): Promise<Profile | null>;
  findBySlug(input: FindProfileBySlugInput): Promise<Profile | null>;
  update(input: UpdateProfileInput): Promise<Profile | null>;
}
