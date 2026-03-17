export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          flavor_text: string | null
          icon_key: string | null
          id: string
          name: string
          rarity: string
          slug: string
          updated_at: string
          visual_theme: Json | null
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          flavor_text?: string | null
          icon_key?: string | null
          id?: string
          name: string
          rarity?: string
          slug: string
          updated_at?: string
          visual_theme?: Json | null
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          flavor_text?: string | null
          icon_key?: string | null
          id?: string
          name?: string
          rarity?: string
          slug?: string
          updated_at?: string
          visual_theme?: Json | null
          xp_reward?: number
        }
        Relationships: []
      }
      boost_campaigns: {
        Row: {
          boosted_entity_type: string | null
          budget_credits: number
          campaign_source: string
          clicks: number
          cpc_rate: number
          created_at: string
          duration_days: number
          ends_at: string
          id: string
          impressions: number
          is_founder_benefit: boolean
          requires_subscription: boolean
          reservations: number
          segment_city: string | null
          segment_interests: string[] | null
          segment_systems: string[] | null
          spent_credits: number
          starts_at: string
          status: string
          target_id: string
          target_title: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boosted_entity_type?: string | null
          budget_credits?: number
          campaign_source?: string
          clicks?: number
          cpc_rate?: number
          created_at?: string
          duration_days?: number
          ends_at?: string
          id?: string
          impressions?: number
          is_founder_benefit?: boolean
          requires_subscription?: boolean
          reservations?: number
          segment_city?: string | null
          segment_interests?: string[] | null
          segment_systems?: string[] | null
          spent_credits?: number
          starts_at?: string
          status?: string
          target_id: string
          target_title: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boosted_entity_type?: string | null
          budget_credits?: number
          campaign_source?: string
          clicks?: number
          cpc_rate?: number
          created_at?: string
          duration_days?: number
          ends_at?: string
          id?: string
          impressions?: number
          is_founder_benefit?: boolean
          requires_subscription?: boolean
          reservations?: number
          segment_city?: string | null
          segment_interests?: string[] | null
          segment_systems?: string[] | null
          spent_credits?: number
          starts_at?: string
          status?: string
          target_id?: string
          target_title?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boost_usage_logs: {
        Row: {
          billing_reference: string | null
          boost_campaign_id: string | null
          created_at: string
          credits_spent: number
          founder_benefit_used: boolean
          id: string
          usage_type: string
          used_at: string
          user_id: string
        }
        Insert: {
          billing_reference?: string | null
          boost_campaign_id?: string | null
          created_at?: string
          credits_spent?: number
          founder_benefit_used?: boolean
          id?: string
          usage_type: string
          used_at?: string
          user_id: string
        }
        Update: {
          billing_reference?: string | null
          boost_campaign_id?: string | null
          created_at?: string
          credits_spent?: number
          founder_benefit_used?: boolean
          id?: string
          usage_type?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boost_usage_logs_boost_campaign_id_fkey"
            columns: ["boost_campaign_id"]
            isOneToOne: false
            referencedRelation: "boost_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          founder_expires_at: string | null
          founder_grants_used: number
          founder_rank: number | null
          founder_started_at: string | null
          free_boosts_per_month: number
          free_boosts_used_current_month: number
          id: string
          is_founder: boolean
          last_month_reset: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          founder_expires_at?: string | null
          founder_grants_used?: number
          founder_rank?: number | null
          founder_started_at?: string | null
          free_boosts_per_month?: number
          free_boosts_used_current_month?: number
          id?: string
          is_founder?: boolean
          last_month_reset?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          founder_expires_at?: string | null
          founder_grants_used?: number
          founder_rank?: number | null
          founder_started_at?: string | null
          free_boosts_per_month?: number
          free_boosts_used_current_month?: number
          id?: string
          is_founder?: boolean
          last_month_reset?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      master_badges: {
        Row: {
          awarded_at: string
          awarded_reason: string | null
          badge_definition_id: string
          id: string
          is_founder_badge: boolean
          source_type: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_reason?: string | null
          badge_definition_id: string
          id?: string
          is_founder_badge?: boolean
          source_type?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_reason?: string | null
          badge_definition_id?: string
          id?: string
          is_founder_badge?: boolean
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_badges_badge_definition_id_fkey"
            columns: ["badge_definition_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      master_xp_profiles: {
        Row: {
          created_at: string
          current_level: number
          current_title: string
          id: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_title?: string
          id?: string
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_title?: string
          id?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mesas: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          format: string
          gm_id: string
          gm_name: string
          id: string
          image_url: string | null
          max_price: number | null
          min_price: number | null
          play_styles: string[] | null
          seats_available: number
          seats_total: number
          session_type: string
          start_at: string
          status: string
          store_id: string | null
          system: string
          tags: string[] | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          format: string
          gm_id: string
          gm_name: string
          id?: string
          image_url?: string | null
          max_price?: number | null
          min_price?: number | null
          play_styles?: string[] | null
          seats_available?: number
          seats_total?: number
          session_type: string
          start_at: string
          status?: string
          store_id?: string | null
          system: string
          tags?: string[] | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          format?: string
          gm_id?: string
          gm_name?: string
          id?: string
          image_url?: string | null
          max_price?: number | null
          min_price?: number | null
          play_styles?: string[] | null
          seats_available?: number
          seats_total?: number
          session_type?: string
          start_at?: string
          status?: string
          store_id?: string | null
          system?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mesas_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          external_payment_id: string | null
          id: string
          paid_at: string | null
          payment_type: string
          provider: string
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_type?: string
          provider?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_type?: string
          provider?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_cycle: string
          code: string
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          id?: string
          is_active?: boolean
          name: string
          price_monthly?: number
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_days: string[] | null
          availability_times: string[] | null
          avatar_url: string | null
          avoided_notes: string | null
          badges: string[] | null
          brand_audience: string[] | null
          brand_budget: string | null
          brand_category: string | null
          brand_objective: string | null
          budget_range: string | null
          city: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          id: string
          lat: number | null
          lng: number | null
          max_players: number | null
          mesa_formats: string[] | null
          name: string | null
          narrative_styles: string[] | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          play_styles: string[] | null
          preferred_format: string | null
          preferred_systems: string[] | null
          role: string | null
          session_format_pref: string | null
          special_services: string[] | null
          target_audience: string | null
          themes_avoided: string[] | null
          themes_liked: string[] | null
          updated_at: string
          user_id: string
          years_mastering: string | null
        }
        Insert: {
          availability_days?: string[] | null
          availability_times?: string[] | null
          avatar_url?: string | null
          avoided_notes?: string | null
          badges?: string[] | null
          brand_audience?: string[] | null
          brand_budget?: string | null
          brand_category?: string | null
          brand_objective?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_players?: number | null
          mesa_formats?: string[] | null
          name?: string | null
          narrative_styles?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          play_styles?: string[] | null
          preferred_format?: string | null
          preferred_systems?: string[] | null
          role?: string | null
          session_format_pref?: string | null
          special_services?: string[] | null
          target_audience?: string | null
          themes_avoided?: string[] | null
          themes_liked?: string[] | null
          updated_at?: string
          user_id: string
          years_mastering?: string | null
        }
        Update: {
          availability_days?: string[] | null
          availability_times?: string[] | null
          avatar_url?: string | null
          avoided_notes?: string | null
          badges?: string[] | null
          brand_audience?: string[] | null
          brand_budget?: string | null
          brand_category?: string | null
          brand_objective?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_players?: number | null
          mesa_formats?: string[] | null
          name?: string | null
          narrative_styles?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          play_styles?: string[] | null
          preferred_format?: string | null
          preferred_systems?: string[] | null
          role?: string | null
          session_format_pref?: string | null
          special_services?: string[] | null
          target_audience?: string | null
          themes_avoided?: string[] | null
          themes_liked?: string[] | null
          updated_at?: string
          user_id?: string
          years_mastering?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          amenities: string[] | null
          capacity: number | null
          city: string | null
          created_at: string
          description: string | null
          game_catalog: string[] | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          opening_days: string[] | null
          owner_id: string
          phone: string | null
          simultaneous_tables: number | null
          ticket_avg: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          game_catalog?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          opening_days?: string[] | null
          owner_id: string
          phone?: string | null
          simultaneous_tables?: number | null
          ticket_avg?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          game_catalog?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          opening_days?: string[] | null
          owner_id?: string
          phone?: string | null
          simultaneous_tables?: number | null
          ticket_avg?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          external_subscription_id: string | null
          id: string
          plan_id: string | null
          plan_name: string
          plan_role: string
          price_cents: number
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_subscription_id?: string | null
          id?: string
          plan_id?: string | null
          plan_name: string
          plan_role: string
          price_cents?: number
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_subscription_id?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string
          plan_role?: string
          price_cents?: number
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          action_type: string
          created_at: string
          id: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_use_boost: { Args: { _user_id: string }; Returns: boolean }
      can_use_founder_boost: { Args: { _user_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { _plan_role?: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
