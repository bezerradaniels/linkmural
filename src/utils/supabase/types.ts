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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      click_events: {
        Row: {
          country: string | null
          device: string | null
          event: string
          id: number
          link_id: string | null
          occurred_at: string
          page_id: string
          referrer_host: string | null
          utm_source: string | null
        }
        Insert: {
          country?: string | null
          device?: string | null
          event?: string
          id?: never
          link_id?: string | null
          occurred_at?: string
          page_id: string
          referrer_host?: string | null
          utm_source?: string | null
        }
        Update: {
          country?: string | null
          device?: string | null
          event?: string
          id?: never
          link_id?: string | null
          occurred_at?: string
          page_id?: string
          referrer_host?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "click_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          cf_hostname_id: string | null
          created_at: string
          hostname: string
          id: string
          page_id: string
          status: string
          verified_at: string | null
        }
        Insert: {
          cf_hostname_id?: string | null
          created_at?: string
          hostname: string
          id?: string
          page_id: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          cf_hostname_id?: string | null
          created_at?: string
          hostname?: string
          id?: string
          page_id?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          active: boolean
          created_at: string
          featured: boolean
          flagged_at: string | null
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["link_kind"]
          page_id: string
          position: number
          subtitle: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          featured?: boolean
          flagged_at?: string | null
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["link_kind"]
          page_id: string
          position?: number
          subtitle?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          featured?: boolean
          flagged_at?: string | null
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["link_kind"]
          page_id?: string
          position?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          event: string
          id: number
          metadata: Json
          occurred_at: string
          page_id: string | null
          slug: string | null
          user_id: string | null
        }
        Insert: {
          event: string
          id?: never
          metadata?: Json
          occurred_at?: string
          page_id?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Update: {
          event?: string
          id?: never
          metadata?: Json
          occurred_at?: string
          page_id?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          address: string | null
          avatar_path: string | null
          bio: string | null
          blocked_at: string | null
          business_name: string
          city: string | null
          cover_path: string | null
          created_at: string
          email: string | null
          hours: Json | null
          id: string
          kind: string | null
          onboarding_step: number
          owner_id: string
          published: boolean
          published_at: string | null
          show_branding: boolean
          slug: string
          status_text: string | null
          style: Database["public"]["Enums"]["page_style"]
          template: Database["public"]["Enums"]["page_template"]
          theme: Json
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avatar_path?: string | null
          bio?: string | null
          blocked_at?: string | null
          business_name?: string
          city?: string | null
          cover_path?: string | null
          created_at?: string
          email?: string | null
          hours?: Json | null
          id?: string
          kind?: string | null
          onboarding_step?: number
          owner_id: string
          published?: boolean
          published_at?: string | null
          show_branding?: boolean
          slug: string
          status_text?: string | null
          style?: Database["public"]["Enums"]["page_style"]
          template?: Database["public"]["Enums"]["page_template"]
          theme?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avatar_path?: string | null
          bio?: string | null
          blocked_at?: string | null
          business_name?: string
          city?: string | null
          cover_path?: string | null
          created_at?: string
          email?: string | null
          hours?: Json | null
          id?: string
          kind?: string | null
          onboarding_step?: number
          owner_id?: string
          published?: boolean
          published_at?: string | null
          show_branding?: boolean
          slug?: string
          status_text?: string | null
          style?: Database["public"]["Enums"]["page_style"]
          template?: Database["public"]["Enums"]["page_template"]
          theme?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          role: string
          stripe_customer_id: string | null
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: string
          stripe_customer_id?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          role?: string
          stripe_customer_id?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          page_id: string
          reason: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          page_id: string
          reason: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          page_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_slugs: {
        Row: {
          reason: string
          slug: string
        }
        Insert: {
          reason?: string
          slug: string
        }
        Update: {
          reason?: string
          slug?: string
        }
        Relationships: []
      }
      slug_holds: {
        Row: {
          expires_at: string
          slug: string
          token: string
        }
        Insert: {
          expires_at?: string
          slug: string
          token: string
        }
        Update: {
          expires_at?: string
          slug?: string
          token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          price_id: string
          status: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          price_id: string
          status: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          price_id?: string
          status?: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_slug_available: { Args: { p_slug: string }; Returns: boolean }
      page_slug_for_host: { Args: { p_host: string }; Returns: string }
      page_stats_daily: {
        Args: { p_from: string; p_page: string; p_to: string }
        Returns: {
          clicks: number
          day: string
          views: number
        }[]
      }
      plan_of: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      public_page_plan: {
        Args: { p_page: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
    }
    Enums: {
      link_kind:
        | "link"
        | "whatsapp"
        | "contact"
        | "pix"
        | "email"
        | "phone"
        | "map"
      page_style:
        | "sport"
        | "calm"
        | "classic"
        | "pop"
        | "bold"
        | "fresh"
        | "zen"
        | "dark"
      page_template: "balcao" | "mosaico" | "cartao"
      plan_tier: "free" | "pro" | "business"
      sub_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
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
      link_kind: [
        "link",
        "whatsapp",
        "contact",
        "pix",
        "email",
        "phone",
        "map",
      ],
      page_style: [
        "sport",
        "calm",
        "classic",
        "pop",
        "bold",
        "fresh",
        "zen",
        "dark",
      ],
      page_template: ["balcao", "mosaico", "cartao"],
      plan_tier: ["free", "pro", "business"],
      sub_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
