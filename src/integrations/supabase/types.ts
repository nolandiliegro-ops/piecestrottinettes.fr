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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _backup_caliper_20260718: {
        Row: {
          caliper_family: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          caliper_family?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          caliper_family?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_compteurs_20260718: {
        Row: {
          backup_at: string | null
          compatible_parts_count: number | null
          id: string | null
          image_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          backup_at?: string | null
          compatible_parts_count?: number | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          backup_at?: string | null
          compatible_parts_count?: number | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_partcompat_brake_20260718: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_partcompat_disc_20260719: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_partcompat_purge_20260718: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_victor_20260717: {
        Row: {
          ligne: Json | null
          src: string | null
        }
        Insert: {
          ligne?: Json | null
          src?: string | null
        }
        Update: {
          ligne?: Json | null
          src?: string | null
        }
        Relationships: []
      }
      ai_learning_logs: {
        Row: {
          confidence_score: number | null
          confirmed_model_id: string | null
          created_at: string | null
          detected_markers: Json
          id: string
          image_url: string | null
          promoted: boolean | null
          promoted_at: string | null
          scan_validation_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          confirmed_model_id?: string | null
          created_at?: string | null
          detected_markers?: Json
          id?: string
          image_url?: string | null
          promoted?: boolean | null
          promoted_at?: string | null
          scan_validation_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          confirmed_model_id?: string | null
          created_at?: string | null
          detected_markers?: Json
          id?: string
          image_url?: string | null
          promoted?: boolean | null
          promoted_at?: string | null
          scan_validation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_logs_confirmed_model_id_fkey"
            columns: ["confirmed_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_logs_scan_validation_id_fkey"
            columns: ["scan_validation_id"]
            isOneToOne: false
            referencedRelation: "scan_validations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_requests: {
        Row: {
          component_type: string
          created_at: string | null
          id: string
          instructions: string | null
          model_id: string
          priority_score: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          component_type: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          model_id: string
          priority_score?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          component_type?: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          model_id?: string
          priority_score?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_requests_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          alt_text: string | null
          asset_key: string
          asset_url: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt_text?: string | null
          asset_key: string
          asset_url?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt_text?: string | null
          asset_key?: string
          asset_url?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          accent_color: string | null
          articles: Json | null
          awards: Json | null
          cons: Json | null
          country: string | null
          created_at: string
          description: string | null
          display_order: number
          editorial_summary: string | null
          editorial_verdict: string | null
          entry_style: string | null
          faq: Json | null
          founded_year: number | null
          gallery: Json | null
          hero_image_url: string | null
          id: string
          is_star: boolean
          last_verified_at: string | null
          logo_url: string | null
          name: string
          pros: Json | null
          published: boolean
          related_brand_slugs: Json | null
          score_budget: number | null
          score_comfort: number | null
          score_lightweight: number | null
          showcase_model_id: string | null
          signature_color: string | null
          slug: string
          sources: Json | null
          sponsored: boolean
          tagline: string | null
          tile_size: string | null
          videos: Json | null
          watermark_pos: string | null
          website_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          accent_color?: string | null
          articles?: Json | null
          awards?: Json | null
          cons?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          editorial_summary?: string | null
          editorial_verdict?: string | null
          entry_style?: string | null
          faq?: Json | null
          founded_year?: number | null
          gallery?: Json | null
          hero_image_url?: string | null
          id?: string
          is_star?: boolean
          last_verified_at?: string | null
          logo_url?: string | null
          name: string
          pros?: Json | null
          published?: boolean
          related_brand_slugs?: Json | null
          score_budget?: number | null
          score_comfort?: number | null
          score_lightweight?: number | null
          showcase_model_id?: string | null
          signature_color?: string | null
          slug: string
          sources?: Json | null
          sponsored?: boolean
          tagline?: string | null
          tile_size?: string | null
          videos?: Json | null
          watermark_pos?: string | null
          website_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          accent_color?: string | null
          articles?: Json | null
          awards?: Json | null
          cons?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          editorial_summary?: string | null
          editorial_verdict?: string | null
          entry_style?: string | null
          faq?: Json | null
          founded_year?: number | null
          gallery?: Json | null
          hero_image_url?: string | null
          id?: string
          is_star?: boolean
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string
          pros?: Json | null
          published?: boolean
          related_brand_slugs?: Json | null
          score_budget?: number | null
          score_comfort?: number | null
          score_lightweight?: number | null
          showcase_model_id?: string | null
          signature_color?: string | null
          slug?: string
          sources?: Json | null
          sponsored?: boolean
          tagline?: string | null
          tile_size?: string | null
          videos?: Json | null
          watermark_pos?: string | null
          website_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_showcase_model_id_fkey"
            columns: ["showcase_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent_label: string | null
          alt_text: string | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          display_order_home: number | null
          icon: string | null
          id: string
          image_url: string | null
          lucide_icon: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          neon_color: string | null
          parent_id: string | null
          product_count: number | null
          seo_name: string | null
          show_on_home: boolean
          slug: string
          spec_type: string
        }
        Insert: {
          accent_label?: string | null
          alt_text?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          display_order_home?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          lucide_icon?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          neon_color?: string | null
          parent_id?: string | null
          product_count?: number | null
          seo_name?: string | null
          show_on_home?: boolean
          slug: string
          spec_type?: string
        }
        Update: {
          accent_label?: string | null
          alt_text?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          display_order_home?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          lucide_icon?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          neon_color?: string | null
          parent_id?: string | null
          product_count?: number | null
          seo_name?: string | null
          show_on_home?: boolean
          slug?: string
          spec_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          last_reply_at: string | null
          matched_user_id: string | null
          message: string
          name: string
          replied: boolean
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_reply_at?: string | null
          matched_user_id?: string | null
          message: string
          name: string
          replied?: boolean
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_reply_at?: string | null
          matched_user_id?: string | null
          message?: string
          name?: string
          replied?: boolean
          status?: string
          subject?: string
        }
        Relationships: []
      }
      conversation_status: {
        Row: {
          id: string
          order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_tokens: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          key: string
          label: string | null
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          key: string
          label?: string | null
          type?: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          key?: string
          label?: string | null
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      design_tokens_history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_value: string | null
          old_value: string | null
          token_key: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          token_key: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          token_key?: string
        }
        Relationships: []
      }
      expert_captures: {
        Row: {
          ai_extracted_markers: Json | null
          captured_by: string | null
          component_type: string
          created_at: string | null
          id: string
          image_url: string
          model_id: string
          technician_notes: string | null
        }
        Insert: {
          ai_extracted_markers?: Json | null
          captured_by?: string | null
          component_type: string
          created_at?: string | null
          id?: string
          image_url: string
          model_id: string
          technician_notes?: string | null
        }
        Update: {
          ai_extracted_markers?: Json | null
          captured_by?: string | null
          component_type?: string
          created_at?: string | null
          id?: string
          image_url?: string
          model_id?: string
          technician_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_captures_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          part_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          part_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          part_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      fitment_caliper_families: {
        Row: {
          code: string
          label_client: string | null
          note: string | null
        }
        Insert: {
          code: string
          label_client?: string | null
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string | null
          note?: string | null
        }
        Relationships: []
      }
      fitment_disc_diameters: {
        Row: {
          code: string
          label_client: string | null
          note: string | null
        }
        Insert: {
          code: string
          label_client?: string | null
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string | null
          note?: string | null
        }
        Relationships: []
      }
      fitment_disc_holes: {
        Row: {
          code: string
          label_client: string | null
          note: string | null
        }
        Insert: {
          code: string
          label_client?: string | null
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string | null
          note?: string | null
        }
        Relationships: []
      }
      fitment_disc_pcd: {
        Row: {
          code: string
          label_client: string | null
          note: string | null
        }
        Insert: {
          code: string
          label_client?: string | null
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string | null
          note?: string | null
        }
        Relationships: []
      }
      fitment_raw: {
        Row: {
          category: string
          claim_type: string
          dedup_key: string
          ean13: string | null
          geom: Json | null
          geom_signature: string | null
          id: string
          model_slug: string | null
          raw_model: string | null
          raw_payload: Json | null
          raw_title: string | null
          scraped_at: string
          source: string
          source_url: string | null
          supplier_sku: string | null
        }
        Insert: {
          category: string
          claim_type?: string
          dedup_key: string
          ean13?: string | null
          geom?: Json | null
          geom_signature?: string | null
          id?: string
          model_slug?: string | null
          raw_model?: string | null
          raw_payload?: Json | null
          raw_title?: string | null
          scraped_at?: string
          source: string
          source_url?: string | null
          supplier_sku?: string | null
        }
        Update: {
          category?: string
          claim_type?: string
          dedup_key?: string
          ean13?: string | null
          geom?: Json | null
          geom_signature?: string | null
          id?: string
          model_slug?: string | null
          raw_model?: string | null
          raw_payload?: Json | null
          raw_title?: string | null
          scraped_at?: string
          source?: string
          source_url?: string | null
          supplier_sku?: string | null
        }
        Relationships: []
      }
      fitment_rim_diameters: {
        Row: {
          code: string
          label_client: string | null
          note: string | null
        }
        Insert: {
          code: string
          label_client?: string | null
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string | null
          note?: string | null
        }
        Relationships: []
      }
      fitment_tire_sections: {
        Row: {
          code: string
          note: string | null
        }
        Insert: {
          code: string
          note?: string | null
        }
        Update: {
          code?: string
          note?: string | null
        }
        Relationships: []
      }
      garage_modifications: {
        Row: {
          created_at: string | null
          difficulty_level: number | null
          id: string
          installed_at: string | null
          notes: string | null
          order_item_id: string | null
          part_id: string
          user_garage_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          installed_at?: string | null
          notes?: string | null
          order_item_id?: string | null
          part_id: string
          user_garage_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          installed_at?: string | null
          notes?: string | null
          order_item_id?: string | null
          part_id?: string
          user_garage_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "garage_modifications_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_modifications_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_modifications_user_garage_id_fkey"
            columns: ["user_garage_id"]
            isOneToOne: false
            referencedRelation: "user_garage"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_themes: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          key: string
          name: string
          price_eur: number | null
          required_xp: number
          thumbnail_url: string | null
          unlock_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          key: string
          name: string
          price_eur?: number | null
          required_xp?: number
          thumbnail_url?: string | null
          unlock_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          key?: string
          name?: string
          price_eur?: number | null
          required_xp?: number
          thumbnail_url?: string | null
          unlock_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_bridge_settings: {
        Row: {
          created_at: string
          dark_block_color: string
          id: string
          is_enabled: boolean
          updated_at: string
          watermark_color_mode: string
          watermark_opacity: number
          watermark_text: string
        }
        Insert: {
          created_at?: string
          dark_block_color?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          watermark_color_mode?: string
          watermark_opacity?: number
          watermark_text?: string
        }
        Update: {
          created_at?: string
          dark_block_color?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          watermark_color_mode?: string
          watermark_opacity?: number
          watermark_text?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          part_id: string | null
          part_image_url: string | null
          part_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          part_id?: string | null
          part_image_url?: string | null
          part_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          part_id?: string | null
          part_image_url?: string | null
          part_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          contact_message_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          message: string
          order_id: string | null
          read_at: string | null
          sender_type: string
          user_id: string | null
        }
        Insert: {
          contact_message_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          message: string
          order_id?: string | null
          read_at?: string | null
          sender_type: string
          user_id?: string | null
        }
        Update: {
          contact_message_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          message?: string
          order_id?: string | null
          read_at?: string | null
          sender_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          created_at: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string | null
          delivery_method: string | null
          delivery_price: number | null
          id: string
          loyalty_points_earned: number | null
          notes: string | null
          order_number: string
          paid_at: string | null
          postal_code: string
          promo_code: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal_ht: number
          total_ttc: number
          tracking_number: string | null
          tva_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone?: string | null
          delivery_method?: string | null
          delivery_price?: number | null
          id?: string
          loyalty_points_earned?: number | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          postal_code: string
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_ht: number
          total_ttc: number
          tracking_number?: string | null
          tva_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_phone?: string | null
          delivery_method?: string | null
          delivery_price?: number | null
          id?: string
          loyalty_points_earned?: number | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          postal_code?: string
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_ht?: number
          total_ttc?: number
          tracking_number?: string | null
          tva_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      part_compatibility: {
        Row: {
          auto_suggested: boolean
          confidence_level: string
          created_at: string
          id: string
          part_id: string
          scooter_model_id: string
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean
          confidence_level?: string
          created_at?: string
          id?: string
          part_id: string
          scooter_model_id: string
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean
          confidence_level?: string
          created_at?: string
          id?: string
          part_id?: string
          scooter_model_id?: string
          suggestion_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_compatibility_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_compatibility_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      part_slug_aliases: {
        Row: {
          alias: string
          created_at: string
          part_id: string
        }
        Insert: {
          alias: string
          created_at?: string
          part_id: string
        }
        Update: {
          alias?: string
          created_at?: string
          part_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_slug_aliases_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_suppliers: {
        Row: {
          buy_price_ht: number | null
          created_at: string
          id: string
          is_primary: boolean
          notes: string | null
          part_id: string
          shipping_time_days: number | null
          stock_supplier: number | null
          supplier_name: string
          supplier_sku: string | null
          supplier_url: string | null
          updated_at: string
        }
        Insert: {
          buy_price_ht?: number | null
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          part_id: string
          shipping_time_days?: number | null
          stock_supplier?: number | null
          supplier_name: string
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string
        }
        Update: {
          buy_price_ht?: number | null
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          part_id?: string
          shipping_time_days?: number | null
          stock_supplier?: number | null
          supplier_name?: string
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_suppliers_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string
          image_url: string | null
          images: Json
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string
          price: number | null
          price_override: boolean
          published: boolean
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string
          image_url?: string | null
          images?: Json
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name: string
          price?: number | null
          price_override?: boolean
          published?: boolean
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug: string
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string
          image_url?: string | null
          images?: Json
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string
          price?: number | null
          price_override?: boolean
          published?: boolean
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_backup_b1: {
        Row: {
          electrical_specs: Json | null
          id: string | null
          technical_metadata: Json | null
        }
        Insert: {
          electrical_specs?: Json | null
          id?: string | null
          technical_metadata?: Json | null
        }
        Update: {
          electrical_specs?: Json | null
          id?: string | null
          technical_metadata?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_theme_key: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_public: boolean
          performance_points: number | null
          rider_location: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          active_theme_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_public?: boolean
          performance_points?: number | null
          rider_location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          active_theme_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          performance_points?: number | null
          rider_location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Relationships: []
      }
      scan_validations: {
        Row: {
          ai_brand: string
          ai_confidence: string | null
          ai_model: string
          corrected_model_id: string | null
          corrected_text: string | null
          created_at: string
          id: string
          image_url: string | null
          is_validated: boolean | null
          matched_model_id: string | null
          user_id: string | null
          validated_at: string | null
        }
        Insert: {
          ai_brand: string
          ai_confidence?: string | null
          ai_model: string
          corrected_model_id?: string | null
          corrected_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_validated?: boolean | null
          matched_model_id?: string | null
          user_id?: string | null
          validated_at?: string | null
        }
        Update: {
          ai_brand?: string
          ai_confidence?: string | null
          ai_model?: string
          corrected_model_id?: string | null
          corrected_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_validated?: boolean | null
          matched_model_id?: string | null
          user_id?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_validations_corrected_model_id_fkey"
            columns: ["corrected_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_validations_matched_model_id_fkey"
            columns: ["matched_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scooter_battery_configs: {
        Row: {
          amperage: number
          capacity_ah: number
          connector_type: string | null
          created_at: string | null
          energy_wh: number | null
          id: string
          is_default: boolean | null
          label: string | null
          scooter_model_id: string
          updated_at: string
          voltage: number
        }
        Insert: {
          amperage: number
          capacity_ah: number
          connector_type?: string | null
          created_at?: string | null
          energy_wh?: number | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          scooter_model_id: string
          updated_at?: string
          voltage: number
        }
        Update: {
          amperage?: number
          capacity_ah?: number
          connector_type?: string | null
          created_at?: string | null
          energy_wh?: number | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          scooter_model_id?: string
          updated_at?: string
          voltage?: number
        }
        Relationships: [
          {
            foreignKeyName: "scooter_battery_configs_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scooter_models: {
        Row: {
          affiliate_link: string | null
          amperage: number | null
          brake_type: string | null
          brand_id: string
          caliper_family: string | null
          compatible_parts_count: number | null
          created_at: string
          description: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          foldable: boolean | null
          id: string
          image_url: string | null
          images: Json
          ip_rating: string | null
          is_featured_home: boolean
          is_top_moment: boolean
          max_load_kg: number | null
          max_speed_kmh: number | null
          max_speed_private_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          power_watts: number | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          published: boolean
          range_km: number | null
          rim_diameter_code: string | null
          score_auto_adj: number
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number
          score_perf_adj: number
          score_performance: number | null
          search_terms: string | null
          slug: string
          suspension: string | null
          technical_signature: Json | null
          tire_family: string | null
          tire_section_code: string | null
          tire_size: string | null
          voltage: number | null
          weight_kg: number | null
          wheel_inches: number | null
          wheel_size_inches: number | null
          year: number | null
          youtube_video_id: string | null
        }
        Insert: {
          affiliate_link?: string | null
          amperage?: number | null
          brake_type?: string | null
          brand_id: string
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json
          ip_rating?: string | null
          is_featured_home?: boolean
          is_top_moment?: boolean
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean
          range_km?: number | null
          rim_diameter_code?: string | null
          score_auto_adj?: number
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number
          score_perf_adj?: number
          score_performance?: number | null
          search_terms?: string | null
          slug: string
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          voltage?: number | null
          weight_kg?: number | null
          wheel_inches?: number | null
          wheel_size_inches?: number | null
          year?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          affiliate_link?: string | null
          amperage?: number | null
          brake_type?: string | null
          brand_id?: string
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json
          ip_rating?: string | null
          is_featured_home?: boolean
          is_top_moment?: boolean
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean
          range_km?: number | null
          rim_diameter_code?: string | null
          score_auto_adj?: number
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number
          score_perf_adj?: number
          score_performance?: number | null
          search_terms?: string | null
          slug?: string
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          voltage?: number | null
          weight_kg?: number | null
          wheel_inches?: number | null
          wheel_size_inches?: number | null
          year?: number | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scooter_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scooter_models_caliper_family_fkey"
            columns: ["caliper_family"]
            isOneToOne: false
            referencedRelation: "fitment_caliper_families"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_disc_diameter_code_fkey"
            columns: ["disc_diameter_code"]
            isOneToOne: false
            referencedRelation: "fitment_disc_diameters"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_disc_holes_code_fkey"
            columns: ["disc_holes_code"]
            isOneToOne: false
            referencedRelation: "fitment_disc_holes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_disc_pcd_code_fkey"
            columns: ["disc_pcd_code"]
            isOneToOne: false
            referencedRelation: "fitment_disc_pcd"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_rim_diameter_code_fkey"
            columns: ["rim_diameter_code"]
            isOneToOne: false
            referencedRelation: "fitment_rim_diameters"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_tire_section_code_fkey"
            columns: ["tire_section_code"]
            isOneToOne: false
            referencedRelation: "fitment_tire_sections"
            referencedColumns: ["code"]
          },
        ]
      }
      site_assets: {
        Row: {
          alt_text: string | null
          asset_key: string
          asset_url: string
          created_at: string
          id: string
          label: string
          section: string
          seo_name: string | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          asset_key: string
          asset_url?: string
          created_at?: string
          id?: string
          label?: string
          section?: string
          seo_name?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          asset_key?: string
          asset_url?: string
          created_at?: string
          id?: string
          label?: string
          section?: string
          seo_name?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          part_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          part_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          part_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_model_alias: {
        Row: {
          created_at: string
          id: string
          note: string | null
          raw_model: string
          scooter_model_slug: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          raw_model: string
          scooter_model_slug?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          raw_model?: string
          scooter_model_slug?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          created_at: string
          description: string | null
          difficulty: number
          duration_minutes: number
          id: string
          scooter_model_id: string | null
          slug: string
          title: string
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: number
          duration_minutes?: number
          id?: string
          scooter_model_id?: string | null
          slug: string
          title: string
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: number
          duration_minutes?: number
          id?: string
          scooter_model_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorials_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_card_likes: {
        Row: {
          card_owner_id: string | null
          created_at: string | null
          id: string
          liker_user_id: string | null
        }
        Insert: {
          card_owner_id?: string | null
          created_at?: string | null
          id?: string
          liker_user_id?: string | null
        }
        Update: {
          card_owner_id?: string | null
          created_at?: string | null
          id?: string
          liker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_card_likes_card_owner_id_fkey"
            columns: ["card_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_card_likes_liker_user_id_fkey"
            columns: ["liker_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_garage: {
        Row: {
          added_at: string | null
          current_km: number | null
          custom_photo_url: string | null
          id: string
          is_featured: boolean | null
          is_owned: boolean | null
          last_maintenance_date: string | null
          mood: string | null
          next_maintenance_km: number | null
          nickname: string | null
          personal_description: string | null
          photo_xp_claimed: boolean
          scooter_model_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          mood?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
          personal_description?: string | null
          photo_xp_claimed?: boolean
          scooter_model_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          mood?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
          personal_description?: string | null
          photo_xp_claimed?: boolean
          scooter_model_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_garage_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watcher_runs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          error_log: string | null
          errors_count: number
          id: string
          parts_found: number
          parts_inserted: number
          parts_skipped: number
          run_date: string
          scooters_found: number
          scooters_inserted: number
          scooters_skipped: number
          status: string
          summary: Json
          triggered_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          error_log?: string | null
          errors_count?: number
          id?: string
          parts_found?: number
          parts_inserted?: number
          parts_skipped?: number
          run_date?: string
          scooters_found?: number
          scooters_inserted?: number
          scooters_skipped?: number
          status?: string
          summary?: Json
          triggered_by?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          error_log?: string | null
          errors_count?: number
          id?: string
          parts_found?: number
          parts_inserted?: number
          parts_skipped?: number
          run_date?: string
          scooters_found?: number
          scooters_inserted?: number
          scooters_skipped?: number
          status?: string
          summary?: Json
          triggered_by?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_fitment_corroboration: {
        Row: {
          geom_signature: string | null
          model_slug: string | null
          n_sources: number | null
          sources: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_modification_xp: {
        Args: {
          p_category_name: string
          p_difficulty_level: number
          p_is_first_in_category: boolean
        }
        Returns: number
      }
      f_unaccent: { Args: { "": string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_brake_compatibility: {
        Args: never
        Returns: {
          inserted: number
          promoted: number
        }[]
      }
      match_disc_compatibility: {
        Args: never
        Returns: {
          inserted: number
          promoted: number
        }[]
      }
      match_pneumatic_compatibility: { Args: never; Returns: number }
      part_search_text: {
        Args: {
          p_description: string
          p_meta_description: string
          p_meta_title: string
          p_name: string
          p_sku: string
          p_tech: Json
        }
        Returns: string
      }
      search_parts_fuzzy: {
        Args: {
          p_category_ids?: string[]
          p_limit?: number
          p_offset?: number
          p_scooter_id?: string
          q: string
        }
        Returns: {
          category: Json
          category_id: string
          created_at: string
          id: string
          image_url: string
          images: Json
          is_featured: boolean
          match_type: string
          name: string
          price: number
          rank: number
          slug: string
          stock_quantity: number
        }[]
      }
      search_scooter_fuzzy: {
        Args: { search_query: string }
        Returns: {
          brand_name: string
          id: string
          name: string
          similarity: number
          slug: string
        }[]
      }
      set_featured_scooter: {
        Args: { p_scooter_id: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
