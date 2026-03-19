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
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          notes: string | null
          payload_json: Json | null
          target_id: string | null
          target_type: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payload_json?: Json | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payload_json?: Json | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      admin_share_links: {
        Row: {
          admin_user_id: string
          ai_generated_text: string | null
          channels: string[]
          clicks: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          original_url: string
          short_code: string
          title: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          admin_user_id: string
          ai_generated_text?: string | null
          channels?: string[]
          clicks?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          original_url: string
          short_code: string
          title: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_user_id?: string
          ai_generated_text?: string | null
          channels?: string[]
          clicks?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          original_url?: string
          short_code?: string
          title?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details_json: Json | null
          event_type: string
          id: string
          ip_address: string | null
          source: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details_json?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          source?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details_json?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          source?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          created_at: string
          end_time: string | null
          exception_date: string
          exception_type: string
          id: string
          notes: string | null
          role: string
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exception_date: string
          exception_type?: string
          id?: string
          notes?: string | null
          role?: string
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exception_date?: string
          exception_type?: string
          id?: string
          notes?: string | null
          role?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          accepted_formats_json: Json | null
          accepted_modalities_json: Json | null
          availability_type: string
          created_at: string
          day_of_week: number | null
          end_date: string | null
          end_time: string
          id: string
          is_active: boolean
          notes: string | null
          role: string
          rule_type: string
          start_date: string | null
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_formats_json?: Json | null
          accepted_modalities_json?: Json | null
          availability_type?: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          notes?: string | null
          role?: string
          rule_type?: string
          start_date?: string | null
          start_time: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_formats_json?: Json | null
          accepted_modalities_json?: Json | null
          availability_type?: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          role?: string
          rule_type?: string
          start_date?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
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
          is_founder_badge: boolean | null
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
          is_founder_badge?: boolean | null
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
          is_founder_badge?: boolean | null
          name?: string
          rarity?: string
          slug?: string
          updated_at?: string
          visual_theme?: Json | null
          xp_reward?: number
        }
        Relationships: []
      }
      billing_profiles: {
        Row: {
          address_line: string | null
          address_number: string | null
          billing_email: string | null
          billing_phone: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          neighborhood: string | null
          state: string | null
          tax_document: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address_line?: string | null
          address_number?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          state?: string | null
          tax_document?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address_line?: string | null
          address_number?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          state?: string | null
          tax_document?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number | null
          booked_at: string | null
          canceled_at: string | null
          completed_at: string | null
          created_at: string
          currency: string | null
          game_table_id: string
          gm_user_id: string
          id: string
          payment_status: string | null
          player_user_id: string
          seats_reserved: number | null
          source_type: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          store_user_id: string | null
          table_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          booked_at?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          game_table_id: string
          gm_user_id: string
          id?: string
          payment_status?: string | null
          player_user_id: string
          seats_reserved?: number | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          store_user_id?: string | null
          table_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          booked_at?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          game_table_id?: string
          gm_user_id?: string
          id?: string
          payment_status?: string | null
          player_user_id?: string
          seats_reserved?: number | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          store_user_id?: string | null
          table_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_campaigns: {
        Row: {
          boosted_entity_type: string | null
          budget_credits: number
          campaign_name: string | null
          campaign_source: string
          clicks: number
          conversions: number | null
          cpc_rate: number
          created_at: string
          ctr: number | null
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
          target_filters_json: Json | null
          target_id: string
          target_title: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boosted_entity_type?: string | null
          budget_credits?: number
          campaign_name?: string | null
          campaign_source?: string
          clicks?: number
          conversions?: number | null
          cpc_rate?: number
          created_at?: string
          ctr?: number | null
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
          target_filters_json?: Json | null
          target_id: string
          target_title: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boosted_entity_type?: string | null
          budget_credits?: number
          campaign_name?: string | null
          campaign_source?: string
          clicks?: number
          conversions?: number | null
          cpc_rate?: number
          created_at?: string
          ctr?: number | null
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
          target_filters_json?: Json | null
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
      brand_profiles: {
        Row: {
          campaign_goal: string | null
          category: string | null
          company_name: string | null
          created_at: string
          id: string
          monthly_budget: number | null
          target_audience_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_goal?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          monthly_budget?: number | null
          target_audience_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_goal?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          monthly_budget?: number | null
          target_audience_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_assets: {
        Row: {
          asset_type: string
          campaign_id: string
          created_at: string
          id: string
          reference_id: string | null
          updated_at: string
        }
        Insert: {
          asset_type: string
          campaign_id: string
          created_at?: string
          id?: string
          reference_id?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: string
          campaign_id?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_amount: number | null
          campaign_type: string | null
          created_at: string
          currency: string | null
          end_at: string | null
          id: string
          objective: string | null
          owner_role: string | null
          owner_user_id: string
          start_at: string | null
          status: string | null
          target_audience_json: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          campaign_type?: string | null
          created_at?: string
          currency?: string | null
          end_at?: string | null
          id?: string
          objective?: string | null
          owner_role?: string | null
          owner_user_id: string
          start_at?: string | null
          status?: string | null
          target_audience_json?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          campaign_type?: string | null
          created_at?: string
          currency?: string | null
          end_at?: string | null
          id?: string
          objective?: string | null
          owner_role?: string | null
          owner_user_id?: string
          start_at?: string | null
          status?: string | null
          target_audience_json?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_analytics: {
        Row: {
          conversation_id: string
          created_at: string
          event_type: string
          game_table_id: string | null
          id: string
          metadata_json: Json | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          event_type: string
          game_table_id?: string | null
          id?: string
          metadata_json?: Json | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          event_type?: string
          game_table_id?: string | null
          id?: string
          metadata_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_analytics_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_quick_replies: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          role_target: string
          sort_order: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          role_target?: string
          sort_order?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          role_target?: string
          sort_order?: number
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          author_role: string
          clicks: number
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          id: string
          image_url: string | null
          impressions: number
          is_sponsored: boolean
          likes_count: number
          post_type: string
          published_at: string | null
          related_gm_id: string | null
          related_store_id: string | null
          related_table_id: string | null
          shares: number
          slug: string | null
          sponsor_label: string | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          author_role?: string
          clicks?: number
          content: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          is_sponsored?: boolean
          likes_count?: number
          post_type?: string
          published_at?: string | null
          related_gm_id?: string | null
          related_store_id?: string | null
          related_table_id?: string | null
          shares?: number
          slug?: string | null
          sponsor_label?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_role?: string
          clicks?: number
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          is_sponsored?: boolean
          likes_count?: number
          post_type?: string
          published_at?: string | null
          related_gm_id?: string | null
          related_store_id?: string | null
          related_table_id?: string | null
          shares?: number
          slug?: string | null
          sponsor_label?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_related_table_id_fkey"
            columns: ["related_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          application_fee_percent: number
          capabilities_json: Json
          charges_enabled: boolean
          country: string
          created_at: string
          currency: string
          details_submitted: boolean
          id: string
          onboarding_status: string
          onboarding_url: string | null
          payouts_enabled: boolean
          platform_fee_amount: number | null
          requirements_json: Json
          role: string
          stripe_account_type: string
          stripe_connected_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_fee_percent?: number
          capabilities_json?: Json
          charges_enabled?: boolean
          country?: string
          created_at?: string
          currency?: string
          details_submitted?: boolean
          id?: string
          onboarding_status?: string
          onboarding_url?: string | null
          payouts_enabled?: boolean
          platform_fee_amount?: number | null
          requirements_json?: Json
          role: string
          stripe_account_type?: string
          stripe_connected_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_fee_percent?: number
          capabilities_json?: Json
          charges_enabled?: boolean
          country?: string
          created_at?: string
          currency?: string
          details_submitted?: boolean
          id?: string
          onboarding_status?: string
          onboarding_url?: string | null
          payouts_enabled?: boolean
          platform_fee_amount?: number | null
          requirements_json?: Json
          role?: string
          stripe_account_type?: string
          stripe_connected_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_muted: boolean
          last_read_at: string | null
          role_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          role_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          role_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string
          created_at: string
          created_by_user_id: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          related_booking_id: string | null
          related_store_id: string | null
          related_table_id: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          conversation_type?: string
          created_at?: string
          created_by_user_id: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          related_booking_id?: string | null
          related_store_id?: string | null
          related_table_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          created_by_user_id?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          related_booking_id?: string | null
          related_store_id?: string | null
          related_table_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_related_table_id_fkey"
            columns: ["related_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          currency: string
          discount_amount_applied: number
          id: string
          payment_id: string | null
          redeemed_at: string
          stripe_discount_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          currency?: string
          discount_amount_applied?: number
          id?: string
          payment_id?: string | null
          redeemed_at?: string
          stripe_discount_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          currency?: string
          discount_amount_applied?: number
          id?: string
          payment_id?: string | null
          redeemed_at?: string
          stripe_discount_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          code: string
          created_at: string
          credits_amount: number
          currency: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          price_amount: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits_amount: number
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          price_amount: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits_amount?: number
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          price_amount?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      crm_contacts: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          gm_user_id: string
          id: string
          last_interaction_at: string | null
          notes: string | null
          phone: string | null
          player_user_id: string | null
          source_reference_id: string | null
          source_type: string | null
          stage: string | null
          tags_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          gm_user_id: string
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          player_user_id?: string | null
          source_reference_id?: string | null
          source_type?: string | null
          stage?: string | null
          tags_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          gm_user_id?: string
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          player_user_id?: string | null
          source_reference_id?: string | null
          source_type?: string | null
          stage?: string | null
          tags_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          content: string | null
          created_at: string
          crm_contact_id: string
          gm_user_id: string
          id: string
          interaction_type: string
          metadata_json: Json | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          crm_contact_id: string
          gm_user_id: string
          id?: string
          interaction_type: string
          metadata_json?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          crm_contact_id?: string
          gm_user_id?: string
          id?: string
          interaction_type?: string
          metadata_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          pipeline_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          gm_user_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gm_user_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gm_user_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          amount_off: number | null
          applies_to_credit_packages_json: Json
          applies_to_plan_ids_json: Json
          applies_to_roles_json: Json
          created_at: string
          created_by_admin_user_id: string
          currency: string
          discount_type: string
          duration_in_months: number | null
          duration_type: string
          expires_at: string | null
          first_time_customer_only: boolean
          id: string
          internal_name: string
          is_active: boolean
          max_redemptions: number | null
          max_redemptions_per_user: number
          metadata_json: Json
          minimum_amount: number | null
          percent_off: number | null
          public_code: string
          starts_at: string | null
          stripe_coupon_id: string | null
          stripe_promotion_code_id: string | null
          updated_at: string
        }
        Insert: {
          amount_off?: number | null
          applies_to_credit_packages_json?: Json
          applies_to_plan_ids_json?: Json
          applies_to_roles_json?: Json
          created_at?: string
          created_by_admin_user_id: string
          currency?: string
          discount_type?: string
          duration_in_months?: number | null
          duration_type?: string
          expires_at?: string | null
          first_time_customer_only?: boolean
          id?: string
          internal_name: string
          is_active?: boolean
          max_redemptions?: number | null
          max_redemptions_per_user?: number
          metadata_json?: Json
          minimum_amount?: number | null
          percent_off?: number | null
          public_code: string
          starts_at?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_off?: number | null
          applies_to_credit_packages_json?: Json
          applies_to_plan_ids_json?: Json
          applies_to_roles_json?: Json
          created_at?: string
          created_by_admin_user_id?: string
          currency?: string
          discount_type?: string
          duration_in_months?: number | null
          duration_type?: string
          expires_at?: string | null
          first_time_customer_only?: boolean
          id?: string
          internal_name?: string
          is_active?: boolean
          max_redemptions?: number | null
          max_redemptions_per_user?: number
          metadata_json?: Json
          minimum_amount?: number | null
          percent_off?: number | null
          public_code?: string
          starts_at?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          updated_at?: string
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
      feedback_email_queue: {
        Row: {
          created_at: string
          feedback_type: string
          game_table_id: string
          id: string
          recipient_email: string
          recipient_user_id: string
          responded_at: string | null
          sent_at: string | null
          status: string
          table_session_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          game_table_id: string
          id?: string
          recipient_email: string
          recipient_user_id: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          table_session_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          game_table_id?: string
          id?: string
          recipient_email?: string
          recipient_user_id?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          table_session_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_email_queue_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_email_queue_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_performance_metrics: {
        Row: {
          abandonment_rate: number | null
          average_completion_time_seconds: number | null
          form_template_id: string | null
          game_table_id: string
          id: string
          total_started: number
          total_submitted: number
          updated_at: string
        }
        Insert: {
          abandonment_rate?: number | null
          average_completion_time_seconds?: number | null
          form_template_id?: string | null
          game_table_id: string
          id?: string
          total_started?: number
          total_submitted?: number
          updated_at?: string
        }
        Update: {
          abandonment_rate?: number | null
          average_completion_time_seconds?: number | null
          form_template_id?: string | null
          game_table_id?: string
          id?: string
          total_started?: number
          total_submitted?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_performance_metrics_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_performance_metrics_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: true
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          schema_json: Json
          system_template_id: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
          schema_json?: Json
          system_template_id?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          schema_json?: Json
          system_template_id?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_system_template_id_fkey"
            columns: ["system_template_id"]
            isOneToOne: false
            referencedRelation: "rpg_system_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_benefits: {
        Row: {
          created_at: string
          founder_expires_at: string | null
          founder_rank: number
          founder_started_at: string | null
          free_boosts_per_month: number | null
          free_boosts_used_current_month: number | null
          id: string
          is_active: boolean | null
          is_founder: boolean | null
          monthly_reset_reference: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          founder_expires_at?: string | null
          founder_rank: number
          founder_started_at?: string | null
          free_boosts_per_month?: number | null
          free_boosts_used_current_month?: number | null
          id?: string
          is_active?: boolean | null
          is_founder?: boolean | null
          monthly_reset_reference?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          founder_expires_at?: string | null
          founder_rank?: number
          founder_started_at?: string | null
          free_boosts_per_month?: number | null
          free_boosts_used_current_month?: number | null
          id?: string
          is_active?: boolean | null
          is_founder?: boolean | null
          monthly_reset_reference?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_tables: {
        Row: {
          address_text: string | null
          approved_at: string | null
          average_rating: number | null
          city: string | null
          created_at: string
          description: string | null
          end_at: string | null
          gm_user_id: string
          id: string
          match_tags_json: Json | null
          max_price: number | null
          min_price: number | null
          onboarding_fit_json: Json | null
          play_format: string | null
          seats_available: number | null
          seats_total: number | null
          session_type: string | null
          slug: string | null
          start_at: string | null
          status: string | null
          store_user_id: string | null
          system_name: string
          timezone: string | null
          title: string
          total_reviews: number | null
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          address_text?: string | null
          approved_at?: string | null
          average_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          gm_user_id: string
          id?: string
          match_tags_json?: Json | null
          max_price?: number | null
          min_price?: number | null
          onboarding_fit_json?: Json | null
          play_format?: string | null
          seats_available?: number | null
          seats_total?: number | null
          session_type?: string | null
          slug?: string | null
          start_at?: string | null
          status?: string | null
          store_user_id?: string | null
          system_name: string
          timezone?: string | null
          title: string
          total_reviews?: number | null
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          address_text?: string | null
          approved_at?: string | null
          average_rating?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          gm_user_id?: string
          id?: string
          match_tags_json?: Json | null
          max_price?: number | null
          min_price?: number | null
          onboarding_fit_json?: Json | null
          play_format?: string | null
          seats_available?: number | null
          seats_total?: number | null
          session_type?: string | null
          slug?: string | null
          start_at?: string | null
          status?: string | null
          store_user_id?: string | null
          system_name?: string
          timezone?: string | null
          title?: string
          total_reviews?: number | null
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      gm_profiles: {
        Row: {
          accepted_formats_json: Json | null
          availability_json: Json | null
          average_rating: number | null
          beginner_friendly: boolean | null
          created_at: string
          id: string
          max_players_default: number | null
          narrative_style_json: Json | null
          occupancy_rate: number | null
          price_max: number | null
          price_min: number | null
          reputation_score: number | null
          supports_corporate: boolean | null
          supports_educational: boolean | null
          supports_therapeutic: boolean | null
          systems_mastered_json: Json | null
          total_bookings: number | null
          total_reviews: number | null
          total_tables: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_formats_json?: Json | null
          availability_json?: Json | null
          average_rating?: number | null
          beginner_friendly?: boolean | null
          created_at?: string
          id?: string
          max_players_default?: number | null
          narrative_style_json?: Json | null
          occupancy_rate?: number | null
          price_max?: number | null
          price_min?: number | null
          reputation_score?: number | null
          supports_corporate?: boolean | null
          supports_educational?: boolean | null
          supports_therapeutic?: boolean | null
          systems_mastered_json?: Json | null
          total_bookings?: number | null
          total_reviews?: number | null
          total_tables?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_formats_json?: Json | null
          availability_json?: Json | null
          average_rating?: number | null
          beginner_friendly?: boolean | null
          created_at?: string
          id?: string
          max_players_default?: number | null
          narrative_style_json?: Json | null
          occupancy_rate?: number | null
          price_max?: number | null
          price_min?: number | null
          reputation_score?: number | null
          supports_corporate?: boolean | null
          supports_educational?: boolean | null
          supports_therapeutic?: boolean | null
          systems_mastered_json?: Json | null
          total_bookings?: number | null
          total_reviews?: number | null
          total_tables?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interest_leads: {
        Row: {
          city: string | null
          cluster_label: string | null
          common_answers_json: Json | null
          created_at: string
          early_adopter_interest: string | null
          email: string
          gm_answers_json: Json | null
          high_intent_lead: boolean | null
          id: string
          instagram: string | null
          interest_score: number | null
          likely_founder: boolean | null
          likely_paid_user: boolean | null
          name: string
          perceived_value_score: number | null
          plan_objections_json: Json | null
          player_answers_json: Json | null
          preferred_billing_cycle: string | null
          price_fairness_label: string | null
          pricing_feedback_json: Json | null
          pricing_sensitivity: string | null
          primary_role: string | null
          selected_roles_json: Json
          state: string | null
          store_answers_json: Json | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          value_drivers_json: Json | null
          wants_followup: boolean | null
          wants_trial: boolean | null
          whatsapp: string | null
          willingness_to_pay: string | null
        }
        Insert: {
          city?: string | null
          cluster_label?: string | null
          common_answers_json?: Json | null
          created_at?: string
          early_adopter_interest?: string | null
          email: string
          gm_answers_json?: Json | null
          high_intent_lead?: boolean | null
          id?: string
          instagram?: string | null
          interest_score?: number | null
          likely_founder?: boolean | null
          likely_paid_user?: boolean | null
          name: string
          perceived_value_score?: number | null
          plan_objections_json?: Json | null
          player_answers_json?: Json | null
          preferred_billing_cycle?: string | null
          price_fairness_label?: string | null
          pricing_feedback_json?: Json | null
          pricing_sensitivity?: string | null
          primary_role?: string | null
          selected_roles_json?: Json
          state?: string | null
          store_answers_json?: Json | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value_drivers_json?: Json | null
          wants_followup?: boolean | null
          wants_trial?: boolean | null
          whatsapp?: string | null
          willingness_to_pay?: string | null
        }
        Update: {
          city?: string | null
          cluster_label?: string | null
          common_answers_json?: Json | null
          created_at?: string
          early_adopter_interest?: string | null
          email?: string
          gm_answers_json?: Json | null
          high_intent_lead?: boolean | null
          id?: string
          instagram?: string | null
          interest_score?: number | null
          likely_founder?: boolean | null
          likely_paid_user?: boolean | null
          name?: string
          perceived_value_score?: number | null
          plan_objections_json?: Json | null
          player_answers_json?: Json | null
          preferred_billing_cycle?: string | null
          price_fairness_label?: string | null
          pricing_feedback_json?: Json | null
          pricing_sensitivity?: string | null
          primary_role?: string | null
          selected_roles_json?: Json
          state?: string | null
          store_answers_json?: Json | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value_drivers_json?: Json | null
          wants_followup?: boolean | null
          wants_trial?: boolean | null
          whatsapp?: string | null
          willingness_to_pay?: string | null
        }
        Relationships: []
      }
      interest_pricing_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          lead_id: string
          main_objections: Json | null
          main_value_drivers: Json | null
          perceived_price_position: string | null
          plan_presented: string
          preferred_billing_cycle: string | null
          role_context: string
          updated_at: string
          willingness_to_pay_range: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          lead_id: string
          main_objections?: Json | null
          main_value_drivers?: Json | null
          perceived_price_position?: string | null
          plan_presented: string
          preferred_billing_cycle?: string | null
          role_context: string
          updated_at?: string
          willingness_to_pay_range?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          main_objections?: Json | null
          main_value_drivers?: Json | null
          perceived_price_position?: string | null
          plan_presented?: string
          preferred_billing_cycle?: string | null
          role_context?: string
          updated_at?: string
          willingness_to_pay_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interest_pricing_feedback_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "interest_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
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
          last_xp_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_title?: string
          id?: string
          last_xp_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string
          current_level?: number
          current_title?: string
          id?: string
          last_xp_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      mesas: {
        Row: {
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_at: string | null
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
          stripe_price_id: string | null
          stripe_product_id: string | null
          system: string
          tags: string[] | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          system: string
          tags?: string[] | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          message_type: string
          metadata_json: Json | null
          sender_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          metadata_json?: Json | null
          sender_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          metadata_json?: Json | null
          sender_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean | null
          notification_type: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_type: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_type?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_sessions: {
        Row: {
          answers_json: Json | null
          completed_at: string | null
          created_at: string
          current_step: number | null
          id: string
          progress_percent: number | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          progress_percent?: number | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          progress_percent?: number | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          external_payment_id: string | null
          id: string
          metadata_json: Json | null
          paid_at: string | null
          payment_type: string
          provider: string
          status: string
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
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
          metadata_json?: Json | null
          paid_at?: string | null
          payment_type?: string
          provider?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
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
          metadata_json?: Json | null
          paid_at?: string | null
          payment_type?: string
          provider?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
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
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          code: string
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json
          founder_slots_total: number | null
          founder_slots_used: number | null
          id: string
          interval_count: number | null
          is_active: boolean
          is_founder_plan: boolean | null
          is_public: boolean | null
          limits_json: Json | null
          name: string
          price_amount: number | null
          price_monthly: number
          role: string
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          founder_slots_total?: number | null
          founder_slots_used?: number | null
          id?: string
          interval_count?: number | null
          is_active?: boolean
          is_founder_plan?: boolean | null
          is_public?: boolean | null
          limits_json?: Json | null
          name: string
          price_amount?: number | null
          price_monthly?: number
          role: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json
          founder_slots_total?: number | null
          founder_slots_used?: number | null
          id?: string
          interval_count?: number | null
          is_active?: boolean
          is_founder_plan?: boolean | null
          is_public?: boolean | null
          limits_json?: Json | null
          name?: string
          price_amount?: number | null
          price_monthly?: number
          role?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      player_form_submissions: {
        Row: {
          answers_json: Json
          booking_id: string | null
          created_at: string
          form_template_id: string | null
          game_table_id: string
          id: string
          last_edited_at: string | null
          started_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers_json?: Json
          booking_id?: string | null
          created_at?: string
          form_template_id?: string | null
          game_table_id: string
          id?: string
          last_edited_at?: string | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers_json?: Json
          booking_id?: string | null
          created_at?: string
          form_template_id?: string | null
          game_table_id?: string
          id?: string
          last_edited_at?: string | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_form_submissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_form_submissions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_form_submissions_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      player_material_access: {
        Row: {
          booking_id: string | null
          created_at: string
          game_table_id: string
          id: string
          materials_viewed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          game_table_id: string
          id?: string
          materials_viewed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          game_table_id?: string
          id?: string
          materials_viewed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_material_access_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_material_access_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      player_profiles: {
        Row: {
          availability_json: Json | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          experience_level: string | null
          format_preference: string | null
          id: string
          preferred_styles_json: Json | null
          preferred_systems_json: Json | null
          prefers_campaign: boolean | null
          prefers_one_shot: boolean | null
          reservation_limit_per_cycle: number | null
          themes_avoid_json: Json | null
          themes_like_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_json?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          experience_level?: string | null
          format_preference?: string | null
          id?: string
          preferred_styles_json?: Json | null
          preferred_systems_json?: Json | null
          prefers_campaign?: boolean | null
          prefers_one_shot?: boolean | null
          reservation_limit_per_cycle?: number | null
          themes_avoid_json?: Json | null
          themes_like_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_json?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          experience_level?: string | null
          format_preference?: string | null
          id?: string
          preferred_styles_json?: Json | null
          preferred_systems_json?: Json | null
          prefers_campaign?: boolean | null
          prefers_one_shot?: boolean | null
          reservation_limit_per_cycle?: number | null
          themes_avoid_json?: Json | null
          themes_like_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_user_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_share_links: {
        Row: {
          channel: string
          clicks: number
          created_at: string
          id: string
          owner_user_id: string | null
          post_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          channel: string
          clicks?: number
          created_at?: string
          id?: string
          owner_user_id?: string | null
          post_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          channel?: string
          clicks?: number
          created_at?: string
          id?: string
          owner_user_id?: string | null
          post_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_share_links_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          post_type: string | null
          published_at: string | null
          role: string | null
          sponsored_label: string | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string | null
          published_at?: string | null
          role?: string | null
          sponsored_label?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string | null
          published_at?: string | null
          role?: string | null
          sponsored_label?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profile_badges: {
        Row: {
          awarded_at: string | null
          badge_code: string
          badge_description: string | null
          badge_name: string
          badge_type: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
          visual_theme: Json | null
        }
        Insert: {
          awarded_at?: string | null
          badge_code: string
          badge_description?: string | null
          badge_name: string
          badge_type?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
          visual_theme?: Json | null
        }
        Update: {
          awarded_at?: string | null
          badge_code?: string
          badge_description?: string | null
          badge_name?: string
          badge_type?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
          visual_theme?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          availability_days: string[] | null
          availability_times: string[] | null
          avatar_url: string | null
          avoided_notes: string | null
          badge_summary_text: string | null
          badges: string[] | null
          bio: string | null
          brand_audience: string[] | null
          brand_budget: string | null
          brand_category: string | null
          brand_objective: string | null
          budget_range: string | null
          can_gm: boolean
          can_manage_brand: boolean
          can_manage_store: boolean
          can_play: boolean
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          current_title: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          experience_level: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_public: boolean | null
          last_login_at: string | null
          lat: number | null
          lng: number | null
          max_players: number | null
          mesa_formats: string[] | null
          name: string | null
          narrative_styles: string[] | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          play_styles: string[] | null
          preferences_summary: string | null
          preferred_format: string | null
          preferred_systems: string[] | null
          role: string | null
          session_format_pref: string | null
          slug: string | null
          special_services: string[] | null
          state: string | null
          target_audience: string | null
          terms_accepted_at: string | null
          themes_avoided: string[] | null
          themes_liked: string[] | null
          updated_at: string
          user_id: string
          website_url: string | null
          whatsapp: string | null
          years_mastering: string | null
        }
        Insert: {
          auth_provider?: string | null
          availability_days?: string[] | null
          availability_times?: string[] | null
          avatar_url?: string | null
          avoided_notes?: string | null
          badge_summary_text?: string | null
          badges?: string[] | null
          bio?: string | null
          brand_audience?: string[] | null
          brand_budget?: string | null
          brand_category?: string | null
          brand_objective?: string | null
          budget_range?: string | null
          can_gm?: boolean
          can_manage_brand?: boolean
          can_manage_store?: boolean
          can_play?: boolean
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_title?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          last_login_at?: string | null
          lat?: number | null
          lng?: number | null
          max_players?: number | null
          mesa_formats?: string[] | null
          name?: string | null
          narrative_styles?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          play_styles?: string[] | null
          preferences_summary?: string | null
          preferred_format?: string | null
          preferred_systems?: string[] | null
          role?: string | null
          session_format_pref?: string | null
          slug?: string | null
          special_services?: string[] | null
          state?: string | null
          target_audience?: string | null
          terms_accepted_at?: string | null
          themes_avoided?: string[] | null
          themes_liked?: string[] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          whatsapp?: string | null
          years_mastering?: string | null
        }
        Update: {
          auth_provider?: string | null
          availability_days?: string[] | null
          availability_times?: string[] | null
          avatar_url?: string | null
          avoided_notes?: string | null
          badge_summary_text?: string | null
          badges?: string[] | null
          bio?: string | null
          brand_audience?: string[] | null
          brand_budget?: string | null
          brand_category?: string | null
          brand_objective?: string | null
          budget_range?: string | null
          can_gm?: boolean
          can_manage_brand?: boolean
          can_manage_store?: boolean
          can_play?: boolean
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_title?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          last_login_at?: string | null
          lat?: number | null
          lng?: number | null
          max_players?: number | null
          mesa_formats?: string[] | null
          name?: string | null
          narrative_styles?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          play_styles?: string[] | null
          preferences_summary?: string | null
          preferred_format?: string | null
          preferred_systems?: string[] | null
          role?: string | null
          session_format_pref?: string | null
          slug?: string | null
          special_services?: string[] | null
          state?: string | null
          target_audience?: string | null
          terms_accepted_at?: string | null
          themes_avoided?: string[] | null
          themes_liked?: string[] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp?: string | null
          years_mastering?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          is_verified: boolean
          rating: number
          review_type: string | null
          reviewed_store_id: string | null
          reviewed_table_id: string | null
          reviewed_user_id: string
          reviewer_user_id: string
          status: string
          sub_ratings_json: Json | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          rating: number
          review_type?: string | null
          reviewed_store_id?: string | null
          reviewed_table_id?: string | null
          reviewed_user_id: string
          reviewer_user_id: string
          status?: string
          sub_ratings_json?: Json | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          rating?: number
          review_type?: string | null
          reviewed_store_id?: string | null
          reviewed_table_id?: string | null
          reviewed_user_id?: string
          reviewer_user_id?: string
          status?: string
          sub_ratings_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_table_id_fkey"
            columns: ["reviewed_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      rpg_system_templates: {
        Row: {
          cover_image_url: string | null
          created_at: string
          default_character_form_json: Json
          default_materials_json: Json
          description: string | null
          id: string
          slug: string
          system_name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          default_character_form_json?: Json
          default_materials_json?: Json
          description?: string | null
          id?: string
          slug: string
          system_name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          default_character_form_json?: Json
          default_materials_json?: Json
          description?: string | null
          id?: string
          slug?: string
          system_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_feedback: {
        Row: {
          communication_rating: number | null
          created_at: string
          creativity_rating: number | null
          engagement_rating: number | null
          favorite_npc: string | null
          game_table_id: string
          highlights: string | null
          id: string
          improvement_suggestions: string | null
          is_anonymous: boolean
          npc_impressions: string | null
          overall_rating: number
          player_behavior_notes: string | null
          player_preparedness: number | null
          punctuality_rating: number | null
          review_type: string
          reviewed_user_id: string
          reviewer_user_id: string
          table_session_id: string | null
          updated_at: string
          would_play_again: boolean | null
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string
          creativity_rating?: number | null
          engagement_rating?: number | null
          favorite_npc?: string | null
          game_table_id: string
          highlights?: string | null
          id?: string
          improvement_suggestions?: string | null
          is_anonymous?: boolean
          npc_impressions?: string | null
          overall_rating: number
          player_behavior_notes?: string | null
          player_preparedness?: number | null
          punctuality_rating?: number | null
          review_type: string
          reviewed_user_id: string
          reviewer_user_id: string
          table_session_id?: string | null
          updated_at?: string
          would_play_again?: boolean | null
        }
        Update: {
          communication_rating?: number | null
          created_at?: string
          creativity_rating?: number | null
          engagement_rating?: number | null
          favorite_npc?: string | null
          game_table_id?: string
          highlights?: string | null
          id?: string
          improvement_suggestions?: string | null
          is_anonymous?: boolean
          npc_impressions?: string | null
          overall_rating?: number
          player_behavior_notes?: string | null
          player_preparedness?: number | null
          punctuality_rating?: number | null
          review_type?: string
          reviewed_user_id?: string
          reviewer_user_id?: string
          table_session_id?: string | null
          updated_at?: string
          would_play_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feedback_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_npcs: {
        Row: {
          created_at: string
          game_table_id: string
          gm_notes: string | null
          gm_user_id: string
          id: string
          npc_concept: string | null
          npc_name: string
          npc_role: string | null
          player_impressions_json: Json | null
          popularity_score: number | null
          table_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_table_id: string
          gm_notes?: string | null
          gm_user_id: string
          id?: string
          npc_concept?: string | null
          npc_name: string
          npc_role?: string | null
          player_impressions_json?: Json | null
          popularity_score?: number | null
          table_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_table_id?: string
          gm_notes?: string | null
          gm_user_id?: string
          id?: string
          npc_concept?: string | null
          npc_name?: string
          npc_role?: string | null
          player_impressions_json?: Json | null
          popularity_score?: number | null
          table_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_npcs_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_npcs_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      store_profiles: {
        Row: {
          address_line: string | null
          address_number: string | null
          average_rating: number | null
          average_ticket: number | null
          capacity_total: number | null
          city: string | null
          created_at: string
          document_number: string | null
          games_catalog_json: Json | null
          id: string
          latitude: number | null
          legal_name: string | null
          longitude: number | null
          neighborhood: string | null
          operation_days_json: Json | null
          simultaneous_tables: number | null
          state: string | null
          structure_features_json: Json | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          venue_name: string | null
          zip_code: string | null
        }
        Insert: {
          address_line?: string | null
          address_number?: string | null
          average_rating?: number | null
          average_ticket?: number | null
          capacity_total?: number | null
          city?: string | null
          created_at?: string
          document_number?: string | null
          games_catalog_json?: Json | null
          id?: string
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          neighborhood?: string | null
          operation_days_json?: Json | null
          simultaneous_tables?: number | null
          state?: string | null
          structure_features_json?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          venue_name?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line?: string | null
          address_number?: string | null
          average_rating?: number | null
          average_ticket?: number | null
          capacity_total?: number | null
          city?: string | null
          created_at?: string
          document_number?: string | null
          games_catalog_json?: Json | null
          id?: string
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          neighborhood?: string | null
          operation_days_json?: Json | null
          simultaneous_tables?: number | null
          state?: string | null
          structure_features_json?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          venue_name?: string | null
          zip_code?: string | null
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
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          new_plan_id: string | null
          payload_json: Json | null
          previous_plan_id: string | null
          source: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          new_plan_id?: string | null
          payload_json?: Json | null
          previous_plan_id?: string | null
          source?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          new_plan_id?: string | null
          payload_json?: Json | null
          previous_plan_id?: string | null
          source?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_previous_plan_id_fkey"
            columns: ["previous_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean | null
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          external_subscription_id: string | null
          id: string
          plan_id: string | null
          plan_name: string
          plan_role: string
          price_cents: number
          provider: string
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean | null
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_id?: string | null
          plan_name: string
          plan_role: string
          price_cents?: number
          provider?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean | null
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          external_subscription_id?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string
          plan_role?: string
          price_cents?: number
          provider?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
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
      system_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value_json: Json | null
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value_json?: Json | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value_json?: Json | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      table_preparation_flows: {
        Row: {
          created_at: string
          deadline_at: string | null
          description: string | null
          form_template_id: string | null
          game_table_id: string
          id: string
          is_active: boolean
          materials_json: Json
          share_link: string | null
          system_template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          form_template_id?: string | null
          game_table_id: string
          id?: string
          is_active?: boolean
          materials_json?: Json
          share_link?: string | null
          system_template_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          form_template_id?: string | null
          game_table_id?: string
          id?: string
          is_active?: boolean
          materials_json?: Json
          share_link?: string | null
          system_template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_preparation_flows_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_preparation_flows_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: true
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_preparation_flows_system_template_id_fkey"
            columns: ["system_template_id"]
            isOneToOne: false
            referencedRelation: "rpg_system_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          created_at: string
          ends_at: string | null
          game_table_id: string
          id: string
          sequence_number: number | null
          starts_at: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          game_table_id: string
          id?: string
          sequence_number?: number | null
          starts_at: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          game_table_id?: string
          id?: string
          sequence_number?: number | null
          starts_at?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      user_discounts: {
        Row: {
          amount_off: number | null
          applies_to_plan_id: string | null
          applies_to_role: string | null
          billing_cycles_remaining: number | null
          created_at: string
          created_by_admin_id: string | null
          currency: string | null
          discount_coupon_id: string | null
          discount_type: string
          duration_in_months: number | null
          duration_type: string
          ends_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          percent_off: number | null
          source_reference_id: string | null
          source_type: string
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_off?: number | null
          applies_to_plan_id?: string | null
          applies_to_role?: string | null
          billing_cycles_remaining?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          currency?: string | null
          discount_coupon_id?: string | null
          discount_type?: string
          duration_in_months?: number | null
          duration_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          percent_off?: number | null
          source_reference_id?: string | null
          source_type?: string
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_off?: number | null
          applies_to_plan_id?: string | null
          applies_to_role?: string | null
          billing_cycles_remaining?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          currency?: string | null
          discount_coupon_id?: string | null
          discount_type?: string
          duration_in_months?: number | null
          duration_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          percent_off?: number | null
          source_reference_id?: string | null
          source_type?: string
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_discounts_discount_coupon_id_fkey"
            columns: ["discount_coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
        ]
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
      user_sessions: {
        Row: {
          auth_provider: string | null
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_seen_at: string
          os: string | null
          session_token_hash: string | null
          signed_in_at: string
          signed_out_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_provider?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          os?: string | null
          session_token_hash?: string | null
          signed_in_at?: string
          signed_out_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_provider?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          os?: string | null
          session_token_hash?: string | null
          signed_in_at?: string
          signed_out_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          description: string | null
          id: string
          metadata_json: Json | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata_json?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata_json?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
          wallet_type: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
          wallet_type?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
          wallet_type?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          payload_json: Json | null
          processed_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id: string
          payload_json?: Json | null
          processed_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          payload_json?: Json | null
          processed_at?: string
          status?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
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
      is_advisor: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_user: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "admin" | "moderator" | "user" | "advisor"
      billing_interval: "monthly" | "quarterly" | "semiannual" | "annual"
      booking_status:
        | "pending"
        | "confirmed"
        | "canceled"
        | "completed"
        | "refunded"
        | "waitlist"
      payment_status_enum:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "expired"
        | "paused"
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
      app_role: ["admin", "moderator", "user", "advisor"],
      billing_interval: ["monthly", "quarterly", "semiannual", "annual"],
      booking_status: [
        "pending",
        "confirmed",
        "canceled",
        "completed",
        "refunded",
        "waitlist",
      ],
      payment_status_enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      subscription_status: [
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "expired",
        "paused",
      ],
    },
  },
} as const
