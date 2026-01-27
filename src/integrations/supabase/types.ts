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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          product_count: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          product_count?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          product_count?: number | null
          slug?: string
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
      category_images: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          image_url: string
          prompt: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          prompt?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
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
      orders: {
        Row: {
          address: string
          city: string
          created_at: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string | null
          id: string
          loyalty_points_earned: number | null
          order_number: string
          postal_code: string
          status: string
          subtotal_ht: number
          total_ttc: number
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
          id?: string
          loyalty_points_earned?: number | null
          order_number: string
          postal_code: string
          status?: string
          subtotal_ht: number
          total_ttc: number
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
          id?: string
          loyalty_points_earned?: number | null
          order_number?: string
          postal_code?: string
          status?: string
          subtotal_ht?: number
          total_ttc?: number
          tva_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      part_compatibility: {
        Row: {
          created_at: string
          id: string
          part_id: string
          scooter_model_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          part_id: string
          scooter_model_id: string
        }
        Update: {
          created_at?: string
          id?: string
          part_id?: string
          scooter_model_id?: string
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
      parts: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          difficulty_level: number | null
          estimated_install_time_minutes: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string
          price: number | null
          required_tools: string[] | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          estimated_install_time_minutes?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name: string
          price?: number | null
          required_tools?: string[] | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          estimated_install_time_minutes?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string
          price?: number | null
          required_tools?: string[] | null
          sku?: string | null
          slug?: string
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
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          performance_points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          performance_points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          performance_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scooter_battery_configs: {
        Row: {
          amperage: number
          created_at: string | null
          id: string
          is_default: boolean | null
          scooter_model_id: string
          voltage: number
        }
        Insert: {
          amperage: number
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          scooter_model_id: string
          voltage: number
        }
        Update: {
          amperage?: number
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          scooter_model_id?: string
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
          brand_id: string
          compatible_parts_count: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          max_speed_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          power_watts: number | null
          range_km: number | null
          slug: string
          tire_size: string | null
          voltage: number | null
          youtube_video_id: string | null
        }
        Insert: {
          affiliate_link?: string | null
          amperage?: number | null
          brand_id: string
          compatible_parts_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_speed_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          power_watts?: number | null
          range_km?: number | null
          slug: string
          tire_size?: string | null
          voltage?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          affiliate_link?: string | null
          amperage?: number | null
          brand_id?: string
          compatible_parts_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_speed_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          power_watts?: number | null
          range_km?: number | null
          slug?: string
          tire_size?: string | null
          voltage?: number | null
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
        ]
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
      user_garage: {
        Row: {
          added_at: string | null
          current_km: number | null
          custom_photo_url: string | null
          id: string
          is_owned: boolean | null
          last_maintenance_date: string | null
          next_maintenance_km: number | null
          nickname: string | null
          scooter_model_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
          scooter_model_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
