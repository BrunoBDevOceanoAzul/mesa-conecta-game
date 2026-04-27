// Central type definitions for Supabase tables
// These types enforce data contracts and support LGPD compliance

export interface Profile {
  user_id: string;
  email?: string | null;
  name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  role: string;
  is_public?: boolean | null;
  bio?: string | null;
  instagram?: string | null;
  phone?: string | null;
  preferred_systems?: string[] | null;
  play_styles?: string[] | null;
  onboarding_completed?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Mesa {
  id: string;
  title: string;
  system: string;
  system_name?: string | null;
  session_type: string;
  format: string;
  city?: string | null;
  venue?: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_name: string;
  gm_user_id?: string | null;
  gm_instagram?: string | null;
  start_at: string;
  end_at?: string | null;
  status: string;
  tags?: string[] | null;
  play_styles?: string[] | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  mesa_type?: string | null;
  board_game_id?: string | null;
  description?: string | null;
  slug?: string | null;
  is_sponsored?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Booking {
  id: string;
  player_user_id: string;
  gm_user_id: string;
  game_table_id: string;
  status: string;
  payment_status: string;
  amount: number;
  billing_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author_role: string;
  post_type: string;
  title: string | null;
  content: string;
  image_url: string | null;
  status: string;
  is_sponsored: boolean;
  sponsor_label: string | null;
  related_table_id: string | null;
  cta_text: string | null;
  cta_url: string | null;
  tags: string[];
  impressions: number;
  clicks: number;
  shares: number;
  likes_count: number;
  published_at: string;
  slug?: string | null;
  author_name?: string;
  author_avatar_url?: string;
  author_slug?: string;
  author_city?: string;
  table_title?: string;
  table_system?: string;
  table_seats?: number;
  table_start_at?: string;
  table_slug?: string;
  user_liked?: boolean;
  updated_at?: string | null;
}

export interface Ambassador {
  id: string;
  name: string;
  role_label: string;
  avatar_url?: string | null;
  profile_slug?: string | null;
  profile_type: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
}

export interface CartAbandonment {
  id: string;
  player_name: string;
  player_email: string;
  mesa_title: string;
  gm_user_id: string;
  amount: number;
  abandoned_at: string;
  recovered_at?: string | null;
  status: string;
  created_at?: string | null;
}

export interface BlockEntry {
  id: string;
  block_type: string;
  target_email?: string | null;
  target_user_id?: string | null;
  reason?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface StoreProfile {
  user_id: string;
  venue_name?: string | null;
  city?: string | null;
  state?: string | null;
  capacity_total?: number | null;
  simultaneous_tables?: number | null;
  average_ticket?: number | null;
  structure_features_json?: string[] | null;
  games_catalog_json?: string[] | null;
  operation_days_json?: string[] | null;
  created_at?: string | null;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count_1?: number | null;
  unread_count_2?: number | null;
  created_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
}

export interface AdminSetting {
  key: string;
  value: string;
  updated_at?: string | null;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  awarded_at: string;
}

export interface GMSubmission {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface RevenueByUser {
  userId: string;
  name: string;
  role: string;
  totalRevenue: number;
  bookingsCount: number;
  avgTicket: number;
}

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  status: string;
  published_at?: string | null;
  metrics?: Record<string, number> | null;
}

export interface CampaignLead {
  id: string;
  email: string;
  name?: string | null;
  source: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface GameTable {
  id: string;
  store_user_id?: string | null;
  title: string;
  system_name?: string | null;
  seats_available?: number | null;
  start_at?: string | null;
  status: string;
  slug?: string | null;
  created_at?: string | null;
}

// Utility type for Supabase query results
export type DbResult<T> = T | null;
export type DbResultArray<T> = T[] | null;
