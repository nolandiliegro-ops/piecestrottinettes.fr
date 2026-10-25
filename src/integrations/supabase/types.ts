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
      _backup_200x50_redelete_20_10: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          k: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          slug: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          k?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          slug?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          k?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          slug?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_6lite_cfg_20_10: {
        Row: {
          id: string | null
          ncfg: number | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          ncfg?: number | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          ncfg?: number | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_awin_20261022: {
        Row: {
          affiliate_link: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_engwe_20261023: {
        Row: {
          affiliate_link: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_haloknight_20261023: {
        Row: {
          affiliate_link: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_links_20261024: {
        Row: {
          affiliate_link: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_ootd_20261024: {
        Row: {
          affiliate_link: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_programs_20261024: {
        Row: {
          canal: string | null
          code_client: string | null
          code_ref: string | null
          commission: string | null
          contact_email: string | null
          contact_nom: string | null
          created_at: string | null
          id: string | null
          id_marchand: string | null
          lien_base: string | null
          lien_motif: string | null
          marque: string | null
          notes: string | null
          plateforme: string | null
          priorite: string | null
          statut: string | null
          type: string | null
          updated_at: string | null
          url_inscription: string | null
          url_paiements: string | null
          url_tableau_de_bord: string | null
        }
        Insert: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Update: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_programs_20261024b: {
        Row: {
          canal: string | null
          code_client: string | null
          code_ref: string | null
          commission: string | null
          contact_email: string | null
          contact_nom: string | null
          created_at: string | null
          id: string | null
          id_marchand: string | null
          lien_base: string | null
          lien_motif: string | null
          marque: string | null
          notes: string | null
          plateforme: string | null
          priorite: string | null
          statut: string | null
          type: string | null
          updated_at: string | null
          url_inscription: string | null
          url_paiements: string | null
          url_tableau_de_bord: string | null
        }
        Insert: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Update: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_programs_20261024c: {
        Row: {
          canal: string | null
          code_client: string | null
          code_ref: string | null
          commission: string | null
          contact_email: string | null
          contact_nom: string | null
          created_at: string | null
          id: string | null
          id_marchand: string | null
          lien_base: string | null
          lien_motif: string | null
          marque: string | null
          notes: string | null
          plateforme: string | null
          priorite: string | null
          statut: string | null
          type: string | null
          updated_at: string | null
          url_inscription: string | null
          url_paiements: string | null
          url_tableau_de_bord: string | null
        }
        Insert: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Update: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_programs_20261024d: {
        Row: {
          canal: string | null
          code_client: string | null
          code_ref: string | null
          commission: string | null
          contact_email: string | null
          contact_nom: string | null
          created_at: string | null
          id: string | null
          id_marchand: string | null
          lien_base: string | null
          lien_motif: string | null
          marque: string | null
          notes: string | null
          plateforme: string | null
          priorite: string | null
          statut: string | null
          type: string | null
          updated_at: string | null
          url_inscription: string | null
          url_paiements: string | null
          url_tableau_de_bord: string | null
        }
        Insert: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Update: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string | null
          id?: string | null
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string | null
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          statut?: string | null
          type?: string | null
          updated_at?: string | null
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Relationships: []
      }
      _backup_affiliate_teverun_20261021: {
        Row: {
          affiliate_link: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_alias_20260905: {
        Row: {
          created_at: string | null
          id: string | null
          note: string | null
          raw_model: string | null
          scooter_model_slug: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          note?: string | null
          raw_model?: string | null
          scooter_model_slug?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          note?: string | null
          raw_model?: string | null
          scooter_model_slug?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_ambassadors_20261024: {
        Row: {
          created_at: string | null
          email_paypal: string | null
          handle: string | null
          id: string | null
          nom: string | null
          notes: string | null
          reseau: string | null
          statut: string | null
          taux_commission: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          reseau?: string | null
          statut?: string | null
          taux_commission?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          reseau?: string | null
          statut?: string | null
          taux_commission?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_ambassadors_20261024b: {
        Row: {
          abonnes: number | null
          avatar_url: string | null
          created_at: string | null
          email_paypal: string | null
          handle: string | null
          id: string | null
          nom: string | null
          notes: string | null
          prochaine_action: string | null
          relance_le: string | null
          reseau: string | null
          statut: string | null
          taux_commission: number | null
          updated_at: string | null
        }
        Insert: {
          abonnes?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          prochaine_action?: string | null
          relance_le?: string | null
          reseau?: string | null
          statut?: string | null
          taux_commission?: number | null
          updated_at?: string | null
        }
        Update: {
          abonnes?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          prochaine_action?: string | null
          relance_le?: string | null
          reseau?: string | null
          statut?: string | null
          taux_commission?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_ambassadors_20261025: {
        Row: {
          abonnes: number | null
          adresse: string | null
          avatar_url: string | null
          contrat_signe_le: string | null
          contrat_version: string | null
          created_at: string | null
          email: string | null
          email_paypal: string | null
          handle: string | null
          id: string | null
          nom: string | null
          notes: string | null
          pays_residence: string | null
          prochaine_action: string | null
          produits_offerts_eur: number | null
          relance_le: string | null
          reseau: string | null
          siret: string | null
          statut: string | null
          statut_juridique: string | null
          taux_commission: number | null
          telephone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          abonnes?: number | null
          adresse?: string | null
          avatar_url?: string | null
          contrat_signe_le?: string | null
          contrat_version?: string | null
          created_at?: string | null
          email?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          pays_residence?: string | null
          prochaine_action?: string | null
          produits_offerts_eur?: number | null
          relance_le?: string | null
          reseau?: string | null
          siret?: string | null
          statut?: string | null
          statut_juridique?: string | null
          taux_commission?: number | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          abonnes?: number | null
          adresse?: string | null
          avatar_url?: string | null
          contrat_signe_le?: string | null
          contrat_version?: string | null
          created_at?: string | null
          email?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string | null
          nom?: string | null
          notes?: string | null
          pays_residence?: string | null
          prochaine_action?: string | null
          produits_offerts_eur?: number | null
          relance_le?: string | null
          reseau?: string | null
          siret?: string | null
          statut?: string | null
          statut_juridique?: string | null
          taux_commission?: number | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _backup_amperage_20261010: {
        Row: {
          amperage: number | null
          id: string | null
          saved_at: string | null
        }
        Insert: {
          amperage?: number | null
          id?: string | null
          saved_at?: string | null
        }
        Update: {
          amperage?: number | null
          id?: string | null
          saved_at?: string | null
        }
        Relationships: []
      }
      _backup_b01s_24_10: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          saved_at: string | null
          sku: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          saved_at?: string | null
          sku?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          saved_at?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_batt_20_10: {
        Row: {
          id: string | null
          saved_at: string | null
          slug: string | null
          voltage: number | null
        }
        Insert: {
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          voltage?: number | null
        }
        Update: {
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          voltage?: number | null
        }
        Relationships: []
      }
      _backup_batt_correctifs_20261013: {
        Row: {
          data: Json | null
          kind: string | null
        }
        Insert: {
          data?: Json | null
          kind?: string | null
        }
        Update: {
          data?: Json | null
          kind?: string | null
        }
        Relationships: []
      }
      _backup_brand_apollo_cecotec_20261011: {
        Row: {
          accent_color: string | null
          articles: Json | null
          awards: Json | null
          cons: Json | null
          country: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          editorial_summary: string | null
          editorial_verdict: string | null
          entry_style: string | null
          faq: Json | null
          founded_year: number | null
          gallery: Json | null
          hero_image_url: string | null
          id: string | null
          is_star: boolean | null
          last_verified_at: string | null
          logo_url: string | null
          name: string | null
          pros: Json | null
          published: boolean | null
          related_brand_slugs: Json | null
          score_budget: number | null
          score_comfort: number | null
          score_lightweight: number | null
          showcase_model_id: string | null
          signature_color: string | null
          slug: string | null
          sources: Json | null
          sponsored: boolean | null
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
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          editorial_summary?: string | null
          editorial_verdict?: string | null
          entry_style?: string | null
          faq?: Json | null
          founded_year?: number | null
          gallery?: Json | null
          hero_image_url?: string | null
          id?: string | null
          is_star?: boolean | null
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string | null
          pros?: Json | null
          published?: boolean | null
          related_brand_slugs?: Json | null
          score_budget?: number | null
          score_comfort?: number | null
          score_lightweight?: number | null
          showcase_model_id?: string | null
          signature_color?: string | null
          slug?: string | null
          sources?: Json | null
          sponsored?: boolean | null
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
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          editorial_summary?: string | null
          editorial_verdict?: string | null
          entry_style?: string | null
          faq?: Json | null
          founded_year?: number | null
          gallery?: Json | null
          hero_image_url?: string | null
          id?: string | null
          is_star?: boolean | null
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string | null
          pros?: Json | null
          published?: boolean | null
          related_brand_slugs?: Json | null
          score_budget?: number | null
          score_comfort?: number | null
          score_lightweight?: number | null
          showcase_model_id?: string | null
          signature_color?: string | null
          slug?: string | null
          sources?: Json | null
          sponsored?: boolean | null
          tagline?: string | null
          tile_size?: string | null
          videos?: Json | null
          watermark_pos?: string | null
          website_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      _backup_brand_desc_20261013: {
        Row: {
          description: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_brand_laotie_20261011: {
        Row: {
          id: string | null
          logo_url: string | null
          published: boolean | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_brand_seo_20261013: {
        Row: {
          country: string | null
          editorial_verdict: string | null
          faq: Json | null
          founded_year: number | null
          id: string | null
          slug: string | null
          tagline: string | null
          website_url: string | null
        }
        Insert: {
          country?: string | null
          editorial_verdict?: string | null
          faq?: Json | null
          founded_year?: number | null
          id?: string | null
          slug?: string | null
          tagline?: string | null
          website_url?: string | null
        }
        Update: {
          country?: string | null
          editorial_verdict?: string | null
          faq?: Json | null
          founded_year?: number | null
          id?: string | null
          slug?: string | null
          tagline?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      _backup_brands_lot4_20261010: {
        Row: {
          id: string | null
          logo_url: string | null
          published: boolean | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_brands_lot5_20261010b: {
        Row: {
          id: string | null
          logo_url: string | null
          published: boolean | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_brands_publish_20261010: {
        Row: {
          id: string | null
          name: string | null
          published: boolean | null
          saved_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          published?: boolean | null
          saved_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          published?: boolean | null
          saved_at?: string | null
        }
        Relationships: []
      }
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
      _backup_cat_images_20261019: {
        Row: {
          id: string | null
          image_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_cecotec_m_24_10: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_chambres_1025_jante6_20260929: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          sku: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_chambres_sections_20260929: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          sku: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_charge_conn_20261011: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_charge_conn_cecotec_20261011: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_charge_conn_ewatts_20261011: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_charge_conn_lot3_20261011: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_cle_roue_20261010: {
        Row: {
          id: string | null
          image_url: string | null
          rim_diameter_code: string | null
          slug: string | null
          tire_family: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_20_10: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_20_10b: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_20_10c: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_20261020_lot1: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          rim_diameter_code: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_roue_20261017: {
        Row: {
          id: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_cles_roue2_20261017: {
        Row: {
          id: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_compat_chargeurs_20261011: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          saved_at: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          saved_at?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          saved_at?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_compat_disques_vsett_20260929: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_compat_plaquettes_faux_20260929: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_compat_pneuspleins_20260928: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_compat_position_20260923: {
        Row: {
          backup_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
        }
        Insert: {
          backup_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
        }
        Update: {
          backup_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
        }
        Relationships: []
      }
      _backup_compat_vsett_cles_20260929: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_compat_xtech_faux_20260929: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
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
      _backup_conn_t10_20261013: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_disc_44_6_20261011: {
        Row: {
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_disc_44_6_top_20261013: {
        Row: {
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_etriers_20260929: {
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
      _backup_etriers_passe2_20260929: {
        Row: {
          id: string | null
          kind: string | null
          ref: string | null
          val: Json | null
        }
        Insert: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Update: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Relationships: []
      }
      _backup_ewheel_lot1_20261011: {
        Row: {
          id: string | null
          published: boolean | null
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_ewheel_lot2_20261011: {
        Row: {
          id: string | null
          published: boolean | null
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_ewm813_images_20_10: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          saved_at: string | null
          sku: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          sku?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_galeries_20261016: {
        Row: {
          backed_up_at: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_galeries_20261017: {
        Row: {
          backed_up_at: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_images_audit_20260929: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_keys_20260918: {
        Row: {
          id: string | null
          image_url: string | null
          rim_diameter_code: string | null
          slug: string | null
          tire_section_code: string | null
          tire_size: string | null
          wheel_inches: number | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          wheel_inches?: number | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          wheel_inches?: number | null
        }
        Relationships: []
      }
      _backup_kukirin_20260908: {
        Row: {
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          image_url: string | null
          slug: string | null
        }
        Insert: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
        }
        Update: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_logos_20261010: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          published: boolean | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_logos_marques_20261010: {
        Row: {
          id: string | null
          logo_url: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_lot3_20261010: {
        Row: {
          id: string | null
          kind: string | null
          published: boolean | null
        }
        Insert: {
          id?: string | null
          kind?: string | null
          published?: boolean | null
        }
        Update: {
          id?: string | null
          kind?: string | null
          published?: boolean | null
        }
        Relationships: []
      }
      _backup_lot4_20261010: {
        Row: {
          id: string | null
          image_url: string | null
          published: boolean | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_lot5_20261010: {
        Row: {
          id: string | null
          kind: string | null
          published: boolean | null
        }
        Insert: {
          id?: string | null
          kind?: string | null
          published?: boolean | null
        }
        Update: {
          id?: string | null
          kind?: string | null
          published?: boolean | null
        }
        Relationships: []
      }
      _backup_lot5b_20261010: {
        Row: {
          affiliate_link: string | null
          amperage: number | null
          brake_type: string | null
          brand_id: string | null
          caliper_family: string | null
          compatible_parts_count: number | null
          created_at: string | null
          description: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          foldable: boolean | null
          id: string | null
          image_url: string | null
          images: Json | null
          ip_rating: string | null
          is_featured_home: boolean | null
          is_top_moment: boolean | null
          max_load_kg: number | null
          max_speed_kmh: number | null
          max_speed_private_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          power_watts: number | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          published: boolean | null
          range_km: number | null
          rim_diameter_code: string | null
          rim_type: string | null
          rim_width_code: string | null
          score_auto_adj: number | null
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number | null
          score_perf_adj: number | null
          score_performance: number | null
          search_terms: string | null
          slug: string | null
          solid_conversion: string | null
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
          brand_id?: string | null
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
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
          brand_id?: string | null
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
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
        Relationships: []
      }
      _backup_nutt_vented_20260929: {
        Row: {
          id: string | null
          kind: string | null
          ref: string | null
          val: Json | null
        }
        Insert: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Update: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Relationships: []
      }
      _backup_ootd_tirefam_20261011: {
        Row: {
          id: string | null
          slug: string | null
          tire_family: string | null
        }
        Insert: {
          id?: string | null
          slug?: string | null
          tire_family?: string | null
        }
        Update: {
          id?: string | null
          slug?: string | null
          tire_family?: string | null
        }
        Relationships: []
      }
      _backup_part_compat_20_10: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_part_compat_20260922: {
        Row: {
          auto_suggested: boolean | null
          backed_up_at: string | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          backed_up_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          backed_up_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
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
      _backup_partkeys_20260918: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          sku: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          sku?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_parts_fitment_20260922: {
        Row: {
          backup_at: string | null
          fitment_specs: Json | null
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          backup_at?: string | null
          fitment_specs?: Json | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          backup_at?: string | null
          fitment_specs?: Json | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_parts_stock_20260922: {
        Row: {
          backed_up_at: string | null
          id: string | null
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
      _backup_pf35_36_20260929: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      _backup_photo_principale_20261016: {
        Row: {
          backed_up_at: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_pneu_cst_10x3_20261011: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          saved_at: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          saved_at?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          saved_at?: string | null
        }
        Relationships: []
      }
      _backup_poids_20260929: {
        Row: {
          id: string | null
          ip_rating: string | null
          max_load_kg: number | null
          slug: string | null
          weight_kg: number | null
        }
        Insert: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Update: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      _backup_poids2_20260929: {
        Row: {
          id: string | null
          ip_rating: string | null
          max_load_kg: number | null
          slug: string | null
          weight_kg: number | null
        }
        Insert: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Update: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      _backup_poids3_20260929: {
        Row: {
          id: string | null
          ip_rating: string | null
          max_load_kg: number | null
          slug: string | null
          weight_kg: number | null
        }
        Insert: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Update: {
          id?: string | null
          ip_rating?: string | null
          max_load_kg?: number | null
          slug?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      _backup_position_maxg2_pp_20260928: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_positions_validees_20260929: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _backup_prise_xiaomi2x_20261013: {
        Row: {
          charge_connectors: string[] | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_prises_ia_20261013: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_prises_xiaomi_20_10: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_prix_regle_20261017: {
        Row: {
          backed_up_at: string | null
          id: string | null
          price: number | null
          price_override: boolean | null
          sku: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          price?: number | null
          price_override?: boolean | null
          sku?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          price?: number | null
          price_override?: boolean | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_promo_codes_20261024: {
        Row: {
          active: boolean | null
          campaign: string | null
          code: string | null
          created_at: string | null
          current_uses: number | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string | null
          max_discount_eur: number | null
          max_uses: number | null
          user_id: string | null
          valid_from: string | null
        }
        Insert: {
          active?: boolean | null
          campaign?: string | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string | null
          max_discount_eur?: number | null
          max_uses?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Update: {
          active?: boolean | null
          campaign?: string | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string | null
          max_discount_eur?: number | null
          max_uses?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Relationships: []
      }
      _backup_pub_scooters_20261019: {
        Row: {
          backed_up_at: string | null
          id: string | null
          name: string | null
          published: boolean | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          name?: string | null
          published?: boolean | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          name?: string | null
          published?: boolean | null
        }
        Relationships: []
      }
      _backup_publish_lot14_20261014: {
        Row: {
          id: string | null
          published: boolean | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_publish_sans_disque_20261010: {
        Row: {
          id: string | null
          published: boolean | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_publish_topparc_20261014: {
        Row: {
          id: string | null
          published: boolean | null
          slug: string | null
          voltage: number | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          slug?: string | null
          voltage?: number | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          slug?: string | null
          voltage?: number | null
        }
        Relationships: []
      }
      _backup_publish_vague2_20261016: {
        Row: {
          backed_up_at: string | null
          id: string | null
          published: boolean | null
          slug: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          published?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_ref_prises_20_10: {
        Row: {
          code: string | null
          label_client: string | null
          note: string | null
          saved_at: string | null
        }
        Insert: {
          code?: string | null
          label_client?: string | null
          note?: string | null
          saved_at?: string | null
        }
        Update: {
          code?: string | null
          label_client?: string | null
          note?: string | null
          saved_at?: string | null
        }
        Relationships: []
      }
      _backup_republish_20261010: {
        Row: {
          affiliate_link: string | null
          amperage: number | null
          brake_type: string | null
          brand_id: string | null
          caliper_family: string | null
          compatible_parts_count: number | null
          created_at: string | null
          description: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          foldable: boolean | null
          id: string | null
          image_url: string | null
          images: Json | null
          ip_rating: string | null
          is_featured_home: boolean | null
          is_top_moment: boolean | null
          max_load_kg: number | null
          max_speed_kmh: number | null
          max_speed_private_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          power_watts: number | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          published: boolean | null
          range_km: number | null
          rim_diameter_code: string | null
          rim_type: string | null
          rim_width_code: string | null
          score_auto_adj: number | null
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number | null
          score_perf_adj: number | null
          score_performance: number | null
          search_terms: string | null
          slug: string | null
          solid_conversion: string | null
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
          brand_id?: string | null
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
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
          brand_id?: string | null
          caliper_family?: string | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
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
        Relationships: []
      }
      _backup_scooter_counts_20261018: {
        Row: {
          compatible_parts_count: number | null
          id: string | null
        }
        Insert: {
          compatible_parts_count?: number | null
          id?: string | null
        }
        Update: {
          compatible_parts_count?: number | null
          id?: string | null
        }
        Relationships: []
      }
      _backup_scooter_desc_20261013: {
        Row: {
          description: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_scooter_disc_20260922: {
        Row: {
          backed_up_at: string | null
          brake_type: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          backed_up_at?: string | null
          brake_type?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          backed_up_at?: string | null
          brake_type?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_scooter_links_prices_20261024: {
        Row: {
          affiliate_link: string | null
          id: string | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          slug: string | null
        }
        Insert: {
          affiliate_link?: string | null
          id?: string | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          slug?: string | null
        }
        Update: {
          affiliate_link?: string | null
          id?: string | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_scooter_solid_20260922: {
        Row: {
          backup_at: string | null
          id: string | null
          published: boolean | null
          rim_diameter_code: string | null
          slug: string | null
          solid_conversion: string | null
          tire_family: string | null
          tire_section_code: string | null
        }
        Insert: {
          backup_at?: string | null
          id?: string | null
          published?: boolean | null
          rim_diameter_code?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Update: {
          backup_at?: string | null
          id?: string | null
          published?: boolean | null
          rim_diameter_code?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_scooterphotos_20260917: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_scootkeys_20260908: {
        Row: {
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          image_url: string | null
          slug: string | null
        }
        Insert: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
        }
        Update: {
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_scores_20260929: {
        Row: {
          id: string | null
          score_autonomy: number | null
          score_offroad: number | null
          score_performance: number | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_performance?: number | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_performance?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_seo_parts_20261013: {
        Row: {
          description: string | null
          id: string | null
          kind: string | null
          meta_description: string | null
          meta_title: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          kind?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          kind?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_solid_rimtype_20260922: {
        Row: {
          backup_at: string | null
          id: string | null
          published: boolean | null
          rim_diameter_code: string | null
          slug: string | null
          solid_conversion: string | null
          tire_section_code: string | null
        }
        Insert: {
          backup_at?: string | null
          id?: string | null
          published?: boolean | null
          rim_diameter_code?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_section_code?: string | null
        }
        Update: {
          backup_at?: string | null
          id?: string | null
          published?: boolean | null
          rim_diameter_code?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _backup_solidconv_kukirin_20260928: {
        Row: {
          id: string | null
          rim_type: string | null
          slug: string | null
          solid_conversion: string | null
        }
        Insert: {
          id?: string | null
          rim_type?: string | null
          slug?: string | null
          solid_conversion?: string | null
        }
        Update: {
          id?: string | null
          rim_type?: string | null
          slug?: string | null
          solid_conversion?: string | null
        }
        Relationships: []
      }
      _backup_sp1213_conn_20261011: {
        Row: {
          electrical_specs: Json | null
          id: string | null
          saved_at: string | null
          sku: string | null
        }
        Insert: {
          electrical_specs?: Json | null
          id?: string | null
          saved_at?: string | null
          sku?: string | null
        }
        Update: {
          electrical_specs?: Json | null
          id?: string | null
          saved_at?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_sp186_s1f_20261011: {
        Row: {
          k: string | null
          ref: string | null
          val: string | null
        }
        Insert: {
          k?: string | null
          ref?: string | null
          val?: string | null
        }
        Update: {
          k?: string | null
          ref?: string | null
          val?: string | null
        }
        Relationships: []
      }
      _backup_statut_absentes_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_from_year: number | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_statut_annees_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_from_year: number | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_statut_decision_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_from_year: number | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_from_year?: number | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_statut_passe2_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_statut_passe3_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_statut_passe4_20261025: {
        Row: {
          commercial_status: string | null
          id: string | null
          sold_until_year: number | null
          status_checked_at: string | null
          status_source: string | null
        }
        Insert: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Update: {
          commercial_status?: string | null
          id?: string | null
          sold_until_year?: number | null
          status_checked_at?: string | null
          status_source?: string | null
        }
        Relationships: []
      }
      _backup_stock_wattiz_20261017: {
        Row: {
          id: string | null
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          id?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          id?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
      _backup_tirefamily_20260917: {
        Row: {
          created_at: string | null
          id: string | null
          image_url: string | null
          slug: string | null
          tire_family: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
          tire_family?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          slug?: string | null
          tire_family?: string | null
        }
        Relationships: []
      }
      _backup_top_moment_20261019: {
        Row: {
          id: string | null
          is_top_moment: boolean | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          is_top_moment?: boolean | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          is_top_moment?: boolean | null
          slug?: string | null
        }
        Relationships: []
      }
      _backup_unpub_cst_20261017: {
        Row: {
          backed_up_at: string | null
          id: string | null
          published: boolean | null
          sku: string | null
        }
        Insert: {
          backed_up_at?: string | null
          id?: string | null
          published?: boolean | null
          sku?: string | null
        }
        Update: {
          backed_up_at?: string | null
          id?: string | null
          published?: boolean | null
          sku?: string | null
        }
        Relationships: []
      }
      _backup_urbanglide_20_10: {
        Row: {
          charge_connectors: string[] | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          slug?: string | null
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
      _backup_vsett_20260929: {
        Row: {
          kind: string | null
          row: Json | null
        }
        Insert: {
          kind?: string | null
          row?: Json | null
        }
        Update: {
          kind?: string | null
          row?: Json | null
        }
        Relationships: []
      }
      _backup_vsett9_jante_20260929: {
        Row: {
          id: string | null
          kind: string | null
          ref: string | null
          val: Json | null
        }
        Insert: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Update: {
          id?: string | null
          kind?: string | null
          ref?: string | null
          val?: Json | null
        }
        Relationships: []
      }
      _backup_xiaomi6_20_10: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          saved_at: string | null
          slug: string | null
          voltage: number | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          voltage?: number | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          voltage?: number | null
        }
        Relationships: []
      }
      _bak_battery_configs_1810: {
        Row: {
          amperage: number | null
          created_at: string | null
          id: string | null
          scooter_model_id: string | null
          voltage: number | null
        }
        Insert: {
          amperage?: number | null
          created_at?: string | null
          id?: string | null
          scooter_model_id?: string | null
          voltage?: number | null
        }
        Update: {
          amperage?: number | null
          created_at?: string | null
          id?: string | null
          scooter_model_id?: string | null
          voltage?: number | null
        }
        Relationships: []
      }
      _bak_blackcat_1910: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      _bak_ch1025_links_1910: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      _bak_ch1025_parts_1910: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      _bak_cles_soir_1810: {
        Row: {
          caliper_family: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          id: string | null
          rim_diameter_code: string | null
          slug: string | null
          tire_section_code: string | null
        }
        Insert: {
          caliper_family?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Update: {
          caliper_family?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _bak_dedup_1810: {
        Row: {
          id: string | null
          ps_buy: number | null
          ps_part_id: string | null
          ps_primary: boolean | null
          published: boolean | null
          sku: string | null
          t: string | null
        }
        Insert: {
          id?: string | null
          ps_buy?: number | null
          ps_part_id?: string | null
          ps_primary?: boolean | null
          published?: boolean | null
          sku?: string | null
          t?: string | null
        }
        Update: {
          id?: string | null
          ps_buy?: number | null
          ps_part_id?: string | null
          ps_primary?: boolean | null
          published?: boolean | null
          sku?: string | null
          t?: string | null
        }
        Relationships: []
      }
      _bak_desc_chambres_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_desc_chargeurs_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_desc_disques_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_desc_pilotes_2010: {
        Row: {
          description: string | null
          id: string | null
          image_url: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          image_url?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          image_url?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_desc_plaquettes_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_desc_pneus_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_desc_pneus_pleins_2010: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_parts_2410: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_parts_2410b: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_parts_2510: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_recadrage_1910: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_1910: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2010: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410b: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410c: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410d: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410e: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2410f: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_images_scooters_2510: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_parts_points_bleus_2510: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      _bak_parts_prix_ewheel_1810: {
        Row: {
          id: string | null
          price: number | null
          price_override: boolean | null
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          price?: number | null
          price_override?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          price?: number | null
          price_override?: boolean | null
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_parts_pub_pneus_1810: {
        Row: {
          id: string | null
          published: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          published?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          published?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_plaquettes_1810: {
        Row: {
          id: string | null
          k: string | null
          t: string | null
          v: string | null
        }
        Insert: {
          id?: string | null
          k?: string | null
          t?: string | null
          v?: string | null
        }
        Update: {
          id?: string | null
          k?: string | null
          t?: string | null
          v?: string | null
        }
        Relationships: []
      }
      _bak_prises_conc_1810: {
        Row: {
          charge_connectors: string[] | null
          id: string | null
          slug: string | null
        }
        Insert: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Update: {
          charge_connectors?: string[] | null
          id?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_prix_chambres_1910: {
        Row: {
          at_id: string | null
          id: string | null
          image_url: string | null
          name: string | null
          price: number | null
          saved_at: string | null
        }
        Insert: {
          at_id?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          saved_at?: string | null
        }
        Update: {
          at_id?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          price?: number | null
          saved_at?: string | null
        }
        Relationships: []
      }
      _bak_ps_ewheel_1910: {
        Row: {
          buy_price_ht: number | null
          id: string | null
          part_id: string | null
          saved_at: string | null
          stock_supplier: number | null
          supplier_sku: string | null
        }
        Insert: {
          buy_price_ht?: number | null
          id?: string | null
          part_id?: string | null
          saved_at?: string | null
          stock_supplier?: number | null
          supplier_sku?: string | null
        }
        Update: {
          buy_price_ht?: number | null
          id?: string | null
          part_id?: string | null
          saved_at?: string | null
          stock_supplier?: number | null
          supplier_sku?: string | null
        }
        Relationships: []
      }
      _bak_pure_roue_1910: {
        Row: {
          id: string | null
          name: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _bak_roue_nuit_1810: {
        Row: {
          id: string | null
          rim_diameter_code: string | null
          slug: string | null
          tire_family: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          rim_diameter_code?: string | null
          slug?: string | null
          tire_family?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _bak_sections_1810: {
        Row: {
          fitment_specs: Json | null
          id: string | null
          sku: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      _bak_velity_2510: {
        Row: {
          id: string | null
          image_url: string | null
          images: Json | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          images?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      _bak_velo_depub_1910: {
        Row: {
          id: string | null
          image_url: string | null
          name: string | null
          published: boolean | null
          saved_at: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          name?: string | null
          published?: boolean | null
          saved_at?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          name?: string | null
          published?: boolean | null
          saved_at?: string | null
        }
        Relationships: []
      }
      _bak_zrino_roue_1910: {
        Row: {
          id: string | null
          name: string | null
          rim_diameter_code: string | null
          saved_at: string | null
          tire_section_code: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          tire_section_code?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          rim_diameter_code?: string | null
          saved_at?: string | null
          tire_section_code?: string | null
        }
        Relationships: []
      }
      _stage_brand_seo_20261013: {
        Row: {
          country: string | null
          editorial_verdict: string | null
          faq: Json | null
          founded_year: number | null
          slug: string
          tagline: string | null
          website_url: string | null
        }
        Insert: {
          country?: string | null
          editorial_verdict?: string | null
          faq?: Json | null
          founded_year?: number | null
          slug: string
          tagline?: string | null
          website_url?: string | null
        }
        Update: {
          country?: string | null
          editorial_verdict?: string | null
          faq?: Json | null
          founded_year?: number | null
          slug?: string
          tagline?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      _stage_desc_20261013: {
        Row: {
          description: string | null
          slug: string
        }
        Insert: {
          description?: string | null
          slug: string
        }
        Update: {
          description?: string | null
          slug?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          created_at: string
          id: number
          page_path: string
          placement: string | null
          scooter_slug: string | null
          shop_host: string | null
          target_host: string
        }
        Insert: {
          created_at?: string
          id?: never
          page_path: string
          placement?: string | null
          scooter_slug?: string | null
          shop_host?: string | null
          target_host: string
        }
        Update: {
          created_at?: string
          id?: never
          page_path?: string
          placement?: string | null
          scooter_slug?: string | null
          shop_host?: string | null
          target_host?: string
        }
        Relationships: []
      }
      affiliate_programs: {
        Row: {
          canal: string | null
          code_client: string | null
          code_ref: string | null
          commission: string | null
          contact_email: string | null
          contact_nom: string | null
          created_at: string
          id: string
          id_marchand: string | null
          lien_base: string | null
          lien_motif: string | null
          marque: string
          notes: string | null
          plateforme: string | null
          priorite: string | null
          prochaine_action: string | null
          relance_le: string | null
          statut: string
          type: string
          updated_at: string
          url_inscription: string | null
          url_paiements: string | null
          url_tableau_de_bord: string | null
        }
        Insert: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string
          id?: string
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque: string
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          prochaine_action?: string | null
          relance_le?: string | null
          statut?: string
          type?: string
          updated_at?: string
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
        }
        Update: {
          canal?: string | null
          code_client?: string | null
          code_ref?: string | null
          commission?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          created_at?: string
          id?: string
          id_marchand?: string | null
          lien_base?: string | null
          lien_motif?: string | null
          marque?: string
          notes?: string | null
          plateforme?: string | null
          priorite?: string | null
          prochaine_action?: string | null
          relance_le?: string | null
          statut?: string
          type?: string
          updated_at?: string
          url_inscription?: string | null
          url_paiements?: string | null
          url_tableau_de_bord?: string | null
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
      ambassador_contracts: {
        Row: {
          ambassador_id: string
          id: string
          ip: string | null
          signataire: string
          signe_le: string
          texte: string
          texte_sha256: string
          user_agent: string | null
          version: string
        }
        Insert: {
          ambassador_id: string
          id?: string
          ip?: string | null
          signataire: string
          signe_le?: string
          texte: string
          texte_sha256: string
          user_agent?: string | null
          version: string
        }
        Update: {
          ambassador_id?: string
          id?: string
          ip?: string | null
          signataire?: string
          signe_le?: string
          texte?: string
          texte_sha256?: string
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_contracts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_stats"
            referencedColumns: ["ambassador_id"]
          },
          {
            foreignKeyName: "ambassador_contracts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_events: {
        Row: {
          ambassador_id: string
          auteur: string
          created_at: string
          detail: string | null
          id: string
          titre: string
          type: string
        }
        Insert: {
          ambassador_id: string
          auteur?: string
          created_at?: string
          detail?: string | null
          id?: string
          titre: string
          type: string
        }
        Update: {
          ambassador_id?: string
          auteur?: string
          created_at?: string
          detail?: string | null
          id?: string
          titre?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_events_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_stats"
            referencedColumns: ["ambassador_id"]
          },
          {
            foreignKeyName: "ambassador_events_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payouts: {
        Row: {
          ambassador_id: string
          created_at: string
          id: string
          montant: number
          note: string | null
          paye_le: string | null
          periode: string
          ref_lot_paypal: string | null
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          id?: string
          montant: number
          note?: string | null
          paye_le?: string | null
          periode: string
          ref_lot_paypal?: string | null
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          id?: string
          montant?: number
          note?: string | null
          paye_le?: string | null
          periode?: string
          ref_lot_paypal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payouts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_stats"
            referencedColumns: ["ambassador_id"]
          },
          {
            foreignKeyName: "ambassador_payouts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_statements: {
        Row: {
          ambassador_id: string
          envoye_le: string
          periode: string
          resend_id: string | null
        }
        Insert: {
          ambassador_id: string
          envoye_le?: string
          periode: string
          resend_id?: string | null
        }
        Update: {
          ambassador_id?: string
          envoye_le?: string
          periode?: string
          resend_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_statements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_stats"
            referencedColumns: ["ambassador_id"]
          },
          {
            foreignKeyName: "ambassador_statements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassadors: {
        Row: {
          abonnes: number | null
          adresse: string | null
          avatar_url: string | null
          contrat_signe_le: string | null
          contrat_version: string | null
          created_at: string
          email: string | null
          email_paypal: string | null
          handle: string | null
          id: string
          nom: string
          notes: string | null
          pays_residence: string | null
          prochaine_action: string | null
          produits_offerts_eur: number
          relance_le: string | null
          reseau: string | null
          siret: string | null
          statut: string
          statut_juridique: string | null
          taux_commission: number
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abonnes?: number | null
          adresse?: string | null
          avatar_url?: string | null
          contrat_signe_le?: string | null
          contrat_version?: string | null
          created_at?: string
          email?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string
          nom: string
          notes?: string | null
          pays_residence?: string | null
          prochaine_action?: string | null
          produits_offerts_eur?: number
          relance_le?: string | null
          reseau?: string | null
          siret?: string | null
          statut?: string
          statut_juridique?: string | null
          taux_commission?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abonnes?: number | null
          adresse?: string | null
          avatar_url?: string | null
          contrat_signe_le?: string | null
          contrat_version?: string | null
          created_at?: string
          email?: string | null
          email_paypal?: string | null
          handle?: string | null
          id?: string
          nom?: string
          notes?: string | null
          pays_residence?: string | null
          prochaine_action?: string | null
          produits_offerts_eur?: number
          relance_le?: string | null
          reseau?: string | null
          siret?: string | null
          statut?: string
          statut_juridique?: string | null
          taux_commission?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      atelier_questions: {
        Row: {
          choix: string[]
          cle: string | null
          contexte: string | null
          created_at: string
          famille: string
          id: string
          note: string | null
          ordre: number
          regarder: string | null
          repondu_le: string | null
          repondu_par: string | null
          reponse: string | null
          scooter_slug: string | null
          source: string
          titre: string
          traitee: boolean
        }
        Insert: {
          choix?: string[]
          cle?: string | null
          contexte?: string | null
          created_at?: string
          famille: string
          id: string
          note?: string | null
          ordre?: number
          regarder?: string | null
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_slug?: string | null
          source?: string
          titre: string
          traitee?: boolean
        }
        Update: {
          choix?: string[]
          cle?: string | null
          contexte?: string | null
          created_at?: string
          famille?: string
          id?: string
          note?: string | null
          ordre?: number
          regarder?: string | null
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_slug?: string | null
          source?: string
          titre?: string
          traitee?: boolean
        }
        Relationships: []
      }
      bak_categories_desc_20261025: {
        Row: {
          description: string | null
          id: string | null
          saved_at: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          saved_at?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      bak_user_garage_20261025: {
        Row: {
          added_at: string | null
          current_km: number | null
          custom_photo_url: string | null
          id: string | null
          is_featured: boolean | null
          is_owned: boolean | null
          last_maintenance_date: string | null
          mood: string | null
          next_maintenance_km: number | null
          nickname: string | null
          personal_description: string | null
          photo_xp_claimed: boolean | null
          scooter_model_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          mood?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
          personal_description?: string | null
          photo_xp_claimed?: boolean | null
          scooter_model_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          current_km?: number | null
          custom_photo_url?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          mood?: string | null
          next_maintenance_km?: number | null
          nickname?: string | null
          personal_description?: string | null
          photo_xp_claimed?: boolean | null
          scooter_model_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bk_200x50_20261020: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          k: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          slug: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          k?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          slug?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          k?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          slug?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      bk_compat_recos_20261019: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      bk_grille_chambres_20261019: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      bk_noms_valves_20261019: {
        Row: {
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bk_plein94_20261019: {
        Row: {
          auto_suggested: boolean | null
          confidence_level: string | null
          created_at: string | null
          id: string | null
          part_id: string | null
          position: string | null
          scooter_model_id: string | null
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string | null
          part_id?: string | null
          position?: string | null
          scooter_model_id?: string | null
          suggestion_reason?: string | null
        }
        Relationships: []
      }
      bk_plein94_part_20261019: {
        Row: {
          fitment_specs: Json | null
          id: string | null
        }
        Insert: {
          fitment_specs?: Json | null
          id?: string | null
        }
        Update: {
          fitment_specs?: Json | null
          id?: string | null
        }
        Relationships: []
      }
      bk_pneus_65_cles_20261019: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      bk_pneus_tri_prix_20261019: {
        Row: {
          attributes: Json | null
          category_id: string | null
          characteristics: string | null
          compatibility_source: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          ean: string | null
          electrical_specs: Json | null
          estimated_install_time_minutes: number | null
          fitment_specs: Json | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          min_stock_alert: number | null
          name: string | null
          price: number | null
          price_override: boolean | null
          published: boolean | null
          required_tools: string[] | null
          search_document: string | null
          sku: string | null
          slug: string | null
          slug_locked_at: string | null
          stock_quantity: number | null
          technical_metadata: Json | null
          updated_at: string | null
          youtube_video_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          characteristics?: string | null
          compatibility_source?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          ean?: string | null
          electrical_specs?: Json | null
          estimated_install_time_minutes?: number | null
          fitment_specs?: Json | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          min_stock_alert?: number | null
          name?: string | null
          price?: number | null
          price_override?: boolean | null
          published?: boolean | null
          required_tools?: string[] | null
          search_document?: string | null
          sku?: string | null
          slug?: string | null
          slug_locked_at?: string | null
          stock_quantity?: number | null
          technical_metadata?: Json | null
          updated_at?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      bk_ps_wattiz_prix_20261019: {
        Row: {
          buy_price_ht: number | null
          created_at: string | null
          id: string | null
          is_primary: boolean | null
          notes: string | null
          part_id: string | null
          shipping_time_days: number | null
          stock_supplier: number | null
          supplier_name: string | null
          supplier_sku: string | null
          supplier_url: string | null
          updated_at: string | null
        }
        Insert: {
          buy_price_ht?: number | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          notes?: string | null
          part_id?: string | null
          shipping_time_days?: number | null
          stock_supplier?: number | null
          supplier_name?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string | null
        }
        Update: {
          buy_price_ht?: number | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          notes?: string | null
          part_id?: string | null
          shipping_time_days?: number | null
          stock_supplier?: number | null
          supplier_name?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bk_scooters_cles_corpus_20261019: {
        Row: {
          affiliate_link: string | null
          amperage: number | null
          brake_type: string | null
          brand_id: string | null
          caliper_family: string | null
          charge_connectors: string[] | null
          compatible_parts_count: number | null
          created_at: string | null
          description: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          foldable: boolean | null
          id: string | null
          image_url: string | null
          images: Json | null
          ip_rating: string | null
          is_featured_home: boolean | null
          is_top_moment: boolean | null
          max_load_kg: number | null
          max_speed_kmh: number | null
          max_speed_private_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          power_watts: number | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          published: boolean | null
          range_km: number | null
          rim_diameter_code: string | null
          rim_type: string | null
          rim_width_code: string | null
          score_auto_adj: number | null
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number | null
          score_perf_adj: number | null
          score_performance: number | null
          search_terms: string | null
          slug: string | null
          solid_conversion: string | null
          suspension: string | null
          technical_signature: Json | null
          tire_family: string | null
          tire_section_code: string | null
          tire_size: string | null
          top_rank: number | null
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
          brand_id?: string | null
          caliper_family?: string | null
          charge_connectors?: string[] | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
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
          brand_id?: string | null
          caliper_family?: string | null
          charge_connectors?: string[] | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
          voltage?: number | null
          weight_kg?: number | null
          wheel_inches?: number | null
          wheel_size_inches?: number | null
          year?: number | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      bk_scooters_recos_20261019: {
        Row: {
          affiliate_link: string | null
          amperage: number | null
          brake_type: string | null
          brand_id: string | null
          caliper_family: string | null
          charge_connectors: string[] | null
          compatible_parts_count: number | null
          created_at: string | null
          description: string | null
          disc_diameter_code: string | null
          disc_holes_code: string | null
          disc_pcd_code: string | null
          foldable: boolean | null
          id: string | null
          image_url: string | null
          images: Json | null
          ip_rating: string | null
          is_featured_home: boolean | null
          is_top_moment: boolean | null
          max_load_kg: number | null
          max_speed_kmh: number | null
          max_speed_private_kmh: number | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          power_watts: number | null
          price_checked_at: string | null
          price_eur: number | null
          price_source: string | null
          published: boolean | null
          range_km: number | null
          rim_diameter_code: string | null
          rim_type: string | null
          rim_width_code: string | null
          score_auto_adj: number | null
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number | null
          score_perf_adj: number | null
          score_performance: number | null
          search_terms: string | null
          slug: string | null
          solid_conversion: string | null
          suspension: string | null
          technical_signature: Json | null
          tire_family: string | null
          tire_section_code: string | null
          tire_size: string | null
          top_rank: number | null
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
          brand_id?: string | null
          caliper_family?: string | null
          charge_connectors?: string[] | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
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
          brand_id?: string | null
          caliper_family?: string | null
          charge_connectors?: string[] | null
          compatible_parts_count?: number | null
          created_at?: string | null
          description?: string | null
          disc_diameter_code?: string | null
          disc_holes_code?: string | null
          disc_pcd_code?: string | null
          foldable?: boolean | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          ip_rating?: string | null
          is_featured_home?: boolean | null
          is_top_moment?: boolean | null
          max_load_kg?: number | null
          max_speed_kmh?: number | null
          max_speed_private_kmh?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          power_watts?: number | null
          price_checked_at?: string | null
          price_eur?: number | null
          price_source?: string | null
          published?: boolean | null
          range_km?: number | null
          rim_diameter_code?: string | null
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number | null
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number | null
          score_perf_adj?: number | null
          score_performance?: number | null
          search_terms?: string | null
          slug?: string | null
          solid_conversion?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
          voltage?: number | null
          weight_kg?: number | null
          wheel_inches?: number | null
          wheel_size_inches?: number | null
          year?: number | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      bk_solid_conv_20261019: {
        Row: {
          id: string | null
          slug: string | null
          solid_conversion: string | null
          tire_family: string | null
        }
        Insert: {
          id?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_family?: string | null
        }
        Update: {
          id?: string | null
          slug?: string | null
          solid_conversion?: string | null
          tire_family?: string | null
        }
        Relationships: []
      }
      bk_titre_conf_20261019: {
        Row: {
          confidence_level: string | null
          id: string | null
        }
        Insert: {
          confidence_level?: string | null
          id?: string | null
        }
        Update: {
          confidence_level?: string | null
          id?: string | null
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          created_at: string
          id: string
          notes_atelier: string | null
          publie_le: string | null
          rubrique: string
          slug: string
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes_atelier?: string | null
          publie_le?: string | null
          rubrique?: string
          slug: string
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes_atelier?: string | null
          publie_le?: string | null
          rubrique?: string
          slug?: string
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
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
      brand_assets_backup_20261018: {
        Row: {
          alt_text: string | null
          asset_key: string | null
          asset_url: string | null
          description: string | null
          id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alt_text?: string | null
          asset_key?: string | null
          asset_url?: string | null
          description?: string | null
          id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alt_text?: string | null
          asset_key?: string | null
          asset_url?: string | null
          description?: string | null
          id?: string | null
          updated_at?: string | null
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
      canaris: {
        Row: {
          note: string | null
          part_id: string
          pose_le: string
          ref: string
        }
        Insert: {
          note?: string | null
          part_id: string
          pose_le?: string
          ref: string
        }
        Update: {
          note?: string | null
          part_id?: string
          pose_le?: string
          ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "canaris_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: true
            referencedRelation: "parts"
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
      fitment_brake_types: {
        Row: {
          code: string
          has_disc: boolean
          has_drum: boolean
          label_client: string
          note: string | null
        }
        Insert: {
          code: string
          has_disc: boolean
          has_drum?: boolean
          label_client: string
          note?: string | null
        }
        Update: {
          code?: string
          has_disc?: boolean
          has_drum?: boolean
          label_client?: string
          note?: string | null
        }
        Relationships: []
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
      fitment_charge_connectors: {
        Row: {
          code: string
          label_client: string
          note: string | null
        }
        Insert: {
          code: string
          label_client: string
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string
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
      fitment_exclusion_rules: {
        Row: {
          active: boolean
          condition_code: string
          created_at: string
          id: string
          message: string
          part_category: string
        }
        Insert: {
          active?: boolean
          condition_code: string
          created_at?: string
          id?: string
          message: string
          part_category: string
        }
        Update: {
          active?: boolean
          condition_code?: string
          created_at?: string
          id?: string
          message?: string
          part_category?: string
        }
        Relationships: []
      }
      fitment_positions: {
        Row: {
          code: string
          label_client: string
          note: string | null
        }
        Insert: {
          code: string
          label_client: string
          note?: string | null
        }
        Update: {
          code?: string
          label_client?: string
          note?: string | null
        }
        Relationships: []
      }
      fitment_raw: {
        Row: {
          alias_key: string | null
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
          alias_key?: string | null
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
          alias_key?: string | null
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
      fitment_rim_types: {
        Row: {
          accepte_pneu_plein: boolean
          code: string
          label_client: string
          note: string | null
        }
        Insert: {
          accepte_pneu_plein: boolean
          code: string
          label_client: string
          note?: string | null
        }
        Update: {
          accepte_pneu_plein?: boolean
          code?: string
          label_client?: string
          note?: string | null
        }
        Relationships: []
      }
      fitment_rim_widths: {
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
          carrier: string | null
          city: string
          created_at: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string | null
          delivered_at: string | null
          delivery_estimate: string | null
          delivery_method: string | null
          delivery_price: number | null
          id: string
          loyalty_points_earned: number | null
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          postal_code: string
          pro_account_id: string | null
          pro_notified_at: string | null
          promo_code: string | null
          retrait_prevu: string | null
          shipped_at: string | null
          shipping_email_sent_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal_ht: number
          total_ttc: number
          tracking_number: string | null
          tracking_url: string | null
          tva_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          carrier?: string | null
          city: string
          created_at?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_estimate?: string | null
          delivery_method?: string | null
          delivery_price?: number | null
          id?: string
          loyalty_points_earned?: number | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          postal_code: string
          pro_account_id?: string | null
          pro_notified_at?: string | null
          promo_code?: string | null
          retrait_prevu?: string | null
          shipped_at?: string | null
          shipping_email_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_ht: number
          total_ttc: number
          tracking_number?: string | null
          tracking_url?: string | null
          tva_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          carrier?: string | null
          city?: string
          created_at?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_estimate?: string | null
          delivery_method?: string | null
          delivery_price?: number | null
          id?: string
          loyalty_points_earned?: number | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          postal_code?: string
          pro_account_id?: string | null
          pro_notified_at?: string | null
          promo_code?: string | null
          retrait_prevu?: string | null
          shipped_at?: string | null
          shipping_email_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_ht?: number
          total_ttc?: number
          tracking_number?: string | null
          tracking_url?: string | null
          tva_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_pro_account_id_fkey"
            columns: ["pro_account_id"]
            isOneToOne: false
            referencedRelation: "pro_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_compatibility: {
        Row: {
          auto_suggested: boolean
          confidence_level: string
          created_at: string
          id: string
          part_id: string
          position: string
          scooter_model_id: string
          suggestion_reason: string | null
        }
        Insert: {
          auto_suggested?: boolean
          confidence_level?: string
          created_at?: string
          id?: string
          part_id: string
          position?: string
          scooter_model_id: string
          suggestion_reason?: string | null
        }
        Update: {
          auto_suggested?: boolean
          confidence_level?: string
          created_at?: string
          id?: string
          part_id?: string
          position?: string
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
            foreignKeyName: "part_compatibility_position_fkey"
            columns: ["position"]
            isOneToOne: false
            referencedRelation: "fitment_positions"
            referencedColumns: ["code"]
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
      part_leads: {
        Row: {
          answered_at: string | null
          created_at: string
          email: string
          id: string
          modele_libre: string | null
          part_id: string
          scooter_model_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          email: string
          id?: string
          modele_libre?: string | null
          part_id: string
          scooter_model_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          email?: string
          id?: string
          modele_libre?: string | null
          part_id?: string
          scooter_model_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_leads_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_leads_scooter_model_id_fkey"
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
      price_alerts: {
        Row: {
          active: boolean
          consent_at: string
          created_at: string
          email: string
          id: string
          last_notified_at: string | null
          last_price_notified: number | null
          price_at_signup: number | null
          scooter_model_id: string
          unsubscribe_token: string
        }
        Insert: {
          active?: boolean
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          last_notified_at?: string | null
          last_price_notified?: number | null
          price_at_signup?: number | null
          scooter_model_id: string
          unsubscribe_token?: string
        }
        Update: {
          active?: boolean
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          last_notified_at?: string | null
          last_price_notified?: number | null
          price_at_signup?: number | null
          scooter_model_id?: string
          unsubscribe_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      price_runs: {
        Row: {
          http_status: number | null
          id: number
          in_stock_read: boolean | null
          offer_id: string
          price_read: number | null
          reason: string | null
          request_id: number | null
          run_at: string
          url: string
          written: boolean
        }
        Insert: {
          http_status?: number | null
          id?: number
          in_stock_read?: boolean | null
          offer_id: string
          price_read?: number | null
          reason?: string | null
          request_id?: number | null
          run_at?: string
          url: string
          written?: boolean
        }
        Update: {
          http_status?: number | null
          id?: number
          in_stock_read?: boolean | null
          offer_id?: string
          price_read?: number | null
          reason?: string | null
          request_id?: number | null
          run_at?: string
          url?: string
          written?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "price_runs_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "scooter_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_accounts: {
        Row: {
          access_token: string
          adresse: string | null
          ca_12m_ht: number
          contact_nom: string | null
          created_at: string
          email: string
          id: string
          last_seen_at: string | null
          nom_magasin: string
          notes: string | null
          palier_auto: string
          palier_force: string | null
          siret: string | null
          statut: string
          telephone: string | null
          tva_intra: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string
          adresse?: string | null
          ca_12m_ht?: number
          contact_nom?: string | null
          created_at?: string
          email: string
          id?: string
          last_seen_at?: string | null
          nom_magasin: string
          notes?: string | null
          palier_auto?: string
          palier_force?: string | null
          siret?: string | null
          statut?: string
          telephone?: string | null
          tva_intra?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          adresse?: string | null
          ca_12m_ht?: number
          contact_nom?: string | null
          created_at?: string
          email?: string
          id?: string
          last_seen_at?: string | null
          nom_magasin?: string
          notes?: string | null
          palier_auto?: string
          palier_force?: string | null
          siret?: string | null
          statut?: string
          telephone?: string | null
          tva_intra?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_accounts_palier_auto_fkey"
            columns: ["palier_auto"]
            isOneToOne: false
            referencedRelation: "pro_tiers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pro_accounts_palier_force_fkey"
            columns: ["palier_force"]
            isOneToOne: false
            referencedRelation: "pro_tiers"
            referencedColumns: ["code"]
          },
        ]
      }
      pro_cart_items: {
        Row: {
          cart_id: string
          part_id: string
          quantite: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          part_id: string
          quantite: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          part_id?: string
          quantite?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "pro_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_cart_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_carts: {
        Row: {
          id: string
          note: string | null
          pro_account_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          note?: string | null
          pro_account_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          note?: string | null
          pro_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_carts_pro_account_id_fkey"
            columns: ["pro_account_id"]
            isOneToOne: true
            referencedRelation: "pro_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_settings: {
        Row: {
          cloture_heure: number
          cloture_isodow: number
          id: boolean
          plancher_coef: number
          retrait_decalage_jours: number
          updated_at: string
        }
        Insert: {
          cloture_heure?: number
          cloture_isodow?: number
          id?: boolean
          plancher_coef?: number
          retrait_decalage_jours?: number
          updated_at?: string
        }
        Update: {
          cloture_heure?: number
          cloture_isodow?: number
          id?: boolean
          plancher_coef?: number
          retrait_decalage_jours?: number
          updated_at?: string
        }
        Relationships: []
      }
      pro_tiers: {
        Row: {
          code: string
          nom: string
          ordre: number
          remise_pct: number
          seuil_ca_ht: number
        }
        Insert: {
          code: string
          nom: string
          ordre: number
          remise_pct: number
          seuil_ca_ht?: number
        }
        Update: {
          code?: string
          nom?: string
          ordre?: number
          remise_pct?: number
          seuil_ca_ht?: number
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
          marketing_consent: boolean
          marketing_consent_at: string | null
          performance_points: number | null
          referred_by: string | null
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
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          performance_points?: number | null
          referred_by?: string | null
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
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          performance_points?: number | null
          referred_by?: string | null
          rider_location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean | null
          ambassador_id: string | null
          campaign: string | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount_eur: number | null
          max_uses: number | null
          user_id: string | null
          valid_from: string | null
        }
        Insert: {
          active?: boolean | null
          ambassador_id?: string | null
          campaign?: string | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_discount_eur?: number | null
          max_uses?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Update: {
          active?: boolean | null
          ambassador_id?: string | null
          campaign?: string | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount_eur?: number | null
          max_uses?: number | null
          user_id?: string | null
          valid_from?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_stats"
            referencedColumns: ["ambassador_id"]
          },
          {
            foreignKeyName: "promo_codes_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes_backup_20261008: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          current_uses: number | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string | null
          max_uses: number | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string | null
          max_uses?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string | null
          max_uses?: number | null
        }
        Relationships: []
      }
      ref_visits: {
        Row: {
          code: string
          created_at: string
          id: number
          visitor: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          visitor: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          visitor?: string
        }
        Relationships: []
      }
      rider_questions: {
        Row: {
          brouillon: string | null
          created_at: string
          email: string | null
          id: string
          ip_hash: string | null
          question: string
          repondu_le: string | null
          repondu_par: string | null
          reponse: string | null
          scooter_name: string | null
          scooter_slug: string | null
          slug: string | null
          statut: string
          titre: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brouillon?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_hash?: string | null
          question: string
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_name?: string | null
          scooter_slug?: string | null
          slug?: string | null
          statut?: string
          titre?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brouillon?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_hash?: string | null
          question?: string
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_name?: string | null
          scooter_slug?: string | null
          slug?: string | null
          statut?: string
          titre?: string | null
          updated_at?: string
          user_id?: string | null
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
          year_from: number | null
          year_to: number | null
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
          year_from?: number | null
          year_to?: number | null
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
          year_from?: number | null
          year_to?: number | null
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
          charge_connectors: string[] | null
          commercial_status: string
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
          rim_type: string | null
          rim_width_code: string | null
          score_auto_adj: number
          score_autonomy: number | null
          score_offroad: number | null
          score_offroad_adj: number
          score_perf_adj: number
          score_performance: number | null
          search_terms: string | null
          slug: string
          sold_from_year: number | null
          sold_until_year: number | null
          solid_conversion: string | null
          status_checked_at: string | null
          status_source: string | null
          suspension: string | null
          technical_signature: Json | null
          tire_family: string | null
          tire_section_code: string | null
          tire_size: string | null
          top_rank: number | null
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
          charge_connectors?: string[] | null
          commercial_status?: string
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
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number
          score_perf_adj?: number
          score_performance?: number | null
          search_terms?: string | null
          slug: string
          sold_from_year?: number | null
          sold_until_year?: number | null
          solid_conversion?: string | null
          status_checked_at?: string | null
          status_source?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
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
          charge_connectors?: string[] | null
          commercial_status?: string
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
          rim_type?: string | null
          rim_width_code?: string | null
          score_auto_adj?: number
          score_autonomy?: number | null
          score_offroad?: number | null
          score_offroad_adj?: number
          score_perf_adj?: number
          score_performance?: number | null
          search_terms?: string | null
          slug?: string
          sold_from_year?: number | null
          sold_until_year?: number | null
          solid_conversion?: string | null
          status_checked_at?: string | null
          status_source?: string | null
          suspension?: string | null
          technical_signature?: Json | null
          tire_family?: string | null
          tire_section_code?: string | null
          tire_size?: string | null
          top_rank?: number | null
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
            foreignKeyName: "scooter_models_rim_type_fkey"
            columns: ["rim_type"]
            isOneToOne: false
            referencedRelation: "fitment_rim_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scooter_models_rim_width_code_fkey"
            columns: ["rim_width_code"]
            isOneToOne: false
            referencedRelation: "fitment_rim_widths"
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
      scooter_offers: {
        Row: {
          affiliate_url: string
          created_at: string
          id: string
          in_stock: boolean | null
          is_active: boolean
          last_status: string | null
          merchant_host: string
          notes: string | null
          offer_type: string
          price_checked_at: string | null
          price_eur: number | null
          price_max: number | null
          product_url: string
          scooter_model_id: string
          source_kind: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          affiliate_url: string
          created_at?: string
          id?: string
          in_stock?: boolean | null
          is_active?: boolean
          last_status?: string | null
          merchant_host: string
          notes?: string | null
          offer_type?: string
          price_checked_at?: string | null
          price_eur?: number | null
          price_max?: number | null
          product_url: string
          scooter_model_id: string
          source_kind?: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          affiliate_url?: string
          created_at?: string
          id?: string
          in_stock?: boolean | null
          is_active?: boolean
          last_status?: string | null
          merchant_host?: string
          notes?: string | null
          offer_type?: string
          price_checked_at?: string | null
          price_eur?: number | null
          price_max?: number | null
          product_url?: string
          scooter_model_id?: string
          source_kind?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scooter_offers_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scooters_absents: {
        Row: {
          brand_name: string | null
          created_at: string
          created_by: string | null
          id: string
          model_name: string
          notes: string | null
          status: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_name: string
          notes?: string | null
          status?: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_name?: string
          notes?: string | null
          status?: string
        }
        Relationships: []
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
      skot_eval_runs: {
        Row: {
          detail: Json | null
          finished_at: string | null
          id: string
          kind: string
          n_cas: number | null
          n_juge_rouge: number | null
          n_rouge: number | null
          n_vert: number | null
          run_day: string | null
          started_at: string
          tokens: number | null
          version: string | null
        }
        Insert: {
          detail?: Json | null
          finished_at?: string | null
          id?: string
          kind: string
          n_cas?: number | null
          n_juge_rouge?: number | null
          n_rouge?: number | null
          n_vert?: number | null
          run_day?: string | null
          started_at?: string
          tokens?: number | null
          version?: string | null
        }
        Update: {
          detail?: Json | null
          finished_at?: string | null
          id?: string
          kind?: string
          n_cas?: number | null
          n_juge_rouge?: number | null
          n_rouge?: number | null
          n_vert?: number | null
          run_day?: string | null
          started_at?: string
          tokens?: number | null
          version?: string | null
        }
        Relationships: []
      }
      skot_flags: {
        Row: {
          conversation_id: string
          created_at: string
          extrait: string | null
          id: string
          message_id: string
          note: string | null
          source: string
          traite: boolean
          type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          extrait?: string | null
          id?: string
          message_id: string
          note?: string | null
          source: string
          traite?: boolean
          type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          extrait?: string | null
          id?: string
          message_id?: string
          note?: string | null
          source?: string
          traite?: boolean
          type?: string
        }
        Relationships: []
      }
      skot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          escalated: boolean
          feedback: number | null
          feedback_at: string | null
          has_image: boolean
          id: string
          ip_hash: string | null
          model: string | null
          order_lookup_failed: boolean
          page_slug: string | null
          page_type: string | null
          role: string
          tokens_cache_read: number | null
          tokens_cache_write: number | null
          tokens_in: number | null
          tokens_out: number | null
          tool_calls: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          escalated?: boolean
          feedback?: number | null
          feedback_at?: string | null
          has_image?: boolean
          id?: string
          ip_hash?: string | null
          model?: string | null
          order_lookup_failed?: boolean
          page_slug?: string | null
          page_type?: string | null
          role: string
          tokens_cache_read?: number | null
          tokens_cache_write?: number | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          escalated?: boolean
          feedback?: number | null
          feedback_at?: string | null
          has_image?: boolean
          id?: string
          ip_hash?: string | null
          model?: string | null
          order_lookup_failed?: boolean
          page_slug?: string | null
          page_type?: string | null
          role?: string
          tokens_cache_read?: number | null
          tokens_cache_write?: number | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
          user_id?: string | null
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
      stock_movements: {
        Row: {
          created_at: string
          delta: number
          id: string
          order_id: string
          part_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          order_id: string
          part_id: string
          reason: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          order_id?: string
          part_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_model_alias: {
        Row: {
          alias_key: string | null
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
          alias_key?: string | null
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
          alias_key?: string | null
          created_at?: string
          id?: string
          note?: string | null
          raw_model?: string
          scooter_model_slug?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smalias_slug_fkey"
            columns: ["scooter_model_slug"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["slug"]
          },
        ]
      }
      tire_size_reports: {
        Row: {
          created_at: string
          id: string
          rim: string | null
          scooter_model_id: string
          section: string
        }
        Insert: {
          created_at?: string
          id?: string
          rim?: string | null
          scooter_model_id: string
          section: string
        }
        Update: {
          created_at?: string
          id?: string
          rim?: string | null
          scooter_model_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "tire_size_reports_scooter_model_id_fkey"
            columns: ["scooter_model_id"]
            isOneToOne: false
            referencedRelation: "scooter_models"
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
      ambassador_stats: {
        Row: {
          abonnes: number | null
          adresse: string | null
          ambassador_id: string | null
          avatar_url: string | null
          base_commissionnable_ht: number | null
          cartes_rider: number | null
          clics_30j: number | null
          clics_total: number | null
          codes_actifs: string | null
          commandes: number | null
          commission_acquise: number | null
          commission_en_attente: number | null
          contrat_signe_le: string | null
          contrat_version: string | null
          created_at: string | null
          deja_paye: number | null
          email: string | null
          email_paypal: string | null
          espace_active: boolean | null
          handle: string | null
          nom: string | null
          notes: string | null
          pays_residence: string | null
          prochaine_action: string | null
          produits_offerts_eur: number | null
          relance_le: string | null
          remuneration_annee: number | null
          reseau: string | null
          siret: string | null
          statut: string | null
          statut_juridique: string | null
          taux_commission: number | null
          telephone: string | null
        }
        Relationships: []
      }
      rider_questions_publiques: {
        Row: {
          created_at: string | null
          question: string | null
          repondu_le: string | null
          repondu_par: string | null
          reponse: string | null
          scooter_name: string | null
          scooter_slug: string | null
          slug: string | null
          titre: string | null
        }
        Insert: {
          created_at?: string | null
          question?: string | null
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_name?: string | null
          scooter_slug?: string | null
          slug?: string | null
          titre?: string | null
        }
        Update: {
          created_at?: string | null
          question?: string | null
          repondu_le?: string | null
          repondu_par?: string | null
          reponse?: string | null
          scooter_name?: string | null
          scooter_slug?: string | null
          slug?: string | null
          titre?: string | null
        }
        Relationships: []
      }
      v_fitment_claims: {
        Row: {
          alias_key: string | null
          category: string | null
          claim_type: string | null
          dedup_key: string | null
          ean13: string | null
          geom: Json | null
          geom_signature: string | null
          id: string | null
          model_slug: string | null
          raw_model: string | null
          raw_payload: Json | null
          raw_title: string | null
          resolved_slug: string | null
          scraped_at: string | null
          source: string | null
          source_url: string | null
          supplier_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smalias_slug_fkey"
            columns: ["resolved_slug"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["slug"]
          },
        ]
      }
      v_fitment_corroboration: {
        Row: {
          geom_signature: string | null
          model_slug: string | null
          n_sources: number | null
          sources: string[] | null
        }
        Relationships: []
      }
      v_model_alias_resolved: {
        Row: {
          alias_key: string | null
          scooter_model_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smalias_slug_fkey"
            columns: ["scooter_model_slug"]
            isOneToOne: false
            referencedRelation: "scooter_models"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Functions: {
      admin_compat_counts: {
        Args: never
        Returns: {
          scooter_model_id: string
          to_validate: number
          total: number
        }[]
      }
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_pro_a_commander: {
        Args: never
        Returns: {
          besoin: number
          fournisseur: string
          magasins: string
          manque: number
          name: string
          part_id: string
          qte_commandes: number
          qte_paniers: number
          ref_fournisseur: string
          sku: string
          stock: number
        }[]
      }
      admin_pro_nouveau_lien: { Args: { p_pro: string }; Returns: string }
      ambassador_contract_text: { Args: { p_amb: string }; Returns: string }
      ambassador_contract_version: { Args: never; Returns: string }
      ambassador_etape_label: { Args: { s: string }; Returns: string }
      apply_ambassador: {
        Args: {
          p_abonnes: number
          p_email: string
          p_handle: string
          p_message: string
          p_nom: string
          p_reseau: string
          p_telephone: string
        }
        Returns: boolean
      }
      ask_atelier: {
        Args: {
          p_email?: string
          p_question: string
          p_scooter_name?: string
          p_scooter_slug?: string
        }
        Returns: string
      }
      calculate_modification_xp: {
        Args: {
          p_category_name: string
          p_difficulty_level: number
          p_is_first_in_category: boolean
        }
        Returns: number
      }
      check_promo_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          max_discount_eur: number
          reason: string
          valid: boolean
        }[]
      }
      claim_my_ambassador: { Args: never; Returns: string }
      create_ambassador: {
        Args: {
          p_code?: string
          p_email_paypal?: string
          p_handle?: string
          p_nom: string
        }
        Returns: {
          ambassador_id: string
          code: string
        }[]
      }
      f_unaccent: { Args: { "": string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_rider_launch_code: { Args: { p_user: string }; Returns: string }
      link_guest_orders: { Args: never; Returns: number }
      log_ref_visit: {
        Args: { p_code: string; p_visitor: string }
        Returns: undefined
      }
      make_ambassador_code: { Args: { p_nom: string }; Returns: string }
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
      my_ambassador_dashboard: { Args: never; Returns: Json }
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
      price_alert_mark_sent: {
        Args: { p_alert_id: string; p_price: number }
        Returns: undefined
      }
      price_alerts_due: {
        Args: never
        Returns: {
          alert_id: string
          email: string
          kind: string
          merchant: string
          new_price: number
          old_price: number
          scooter_name: string
          scooter_slug: string
          unsubscribe_token: string
        }[]
      }
      pro_by_token: {
        Args: { p_token: string }
        Returns: {
          access_token: string
          adresse: string | null
          ca_12m_ht: number
          contact_nom: string | null
          created_at: string
          email: string
          id: string
          last_seen_at: string | null
          nom_magasin: string
          notes: string | null
          palier_auto: string
          palier_force: string | null
          siret: string | null
          statut: string
          telephone: string | null
          tva_intra: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "pro_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pro_cart_for: { Args: { p_pro: string }; Returns: Json }
      pro_cycle: { Args: never; Returns: Json }
      pro_effective_tier: {
        Args: { p_pro: string }
        Returns: {
          code: string
          nom: string
          ordre: number
          remise_pct: number
          seuil_ca_ht: number
        }
        SetofOptions: {
          from: "*"
          to: "pro_tiers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pro_recompute_tier: { Args: { p_pro: string }; Returns: string }
      pro_t_cart_set: {
        Args: { p_part: string; p_quantite: number; p_token: string }
        Returns: Json
      }
      pro_t_catalogue: {
        Args: { p_token: string }
        Returns: {
          category_id: string
          deja_commande: number
          ean: string
          image_url: string
          name: string
          part_id: string
          prix_pro_ht: number
          prix_public_ht: number
          sku: string
          slug: string
          stock: number
        }[]
      }
      pro_t_commander: {
        Args: { p_note?: string; p_token: string }
        Returns: Json
      }
      pro_t_commandes: { Args: { p_token: string }; Returns: Json }
      pro_t_me: { Args: { p_token: string }; Returns: Json }
      pro_unit_price_ht: {
        Args: { p_part: string; p_remise: number }
        Returns: number
      }
      pt_model_key: { Args: { t: string }; Returns: string }
      recalc_scooter_parts_count: {
        Args: { ids: string[] }
        Returns: undefined
      }
      refresh_prices_collect: {
        Args: { p_write?: boolean }
        Returns: {
          ancien: number
          decision: string
          dispo: boolean
          host: string
          prix_lu: number
          prix_max_lu: number
          slug: string
          statut: number
        }[]
      }
      refresh_prices_send: { Args: never; Returns: number }
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
      sign_ambassador_contract: {
        Args: { p_signataire: string; p_user_agent?: string }
        Returns: string
      }
      subscribe_price_alert: {
        Args: { p_email: string; p_scooter_id: string }
        Returns: string
      }
      unaccent: { Args: { "": string }; Returns: string }
      unsubscribe_price_alert: { Args: { p_token: string }; Returns: string }
      update_my_ambassador_profile: { Args: { p: Json }; Returns: undefined }
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
