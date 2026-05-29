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
      activity_logs: {
        Row: {
          action: string
          brand_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          brand_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          brand_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_logs: {
        Row: {
          comment: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["post_status"]
          id: string
          post_id: string
          to_status: Database["public"]["Enums"]["post_status"]
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          from_status: Database["public"]["Enums"]["post_status"]
          id?: string
          post_id: string
          to_status: Database["public"]["Enums"]["post_status"]
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["post_status"]
          id?: string
          post_id?: string
          to_status?: Database["public"]["Enums"]["post_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string
          auto_publish_enabled: boolean | null
          brand_id: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name: string
          auto_publish_enabled?: boolean | null
          brand_id: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string
          auto_publish_enabled?: boolean | null
          brand_id?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          platform?: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_members: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_archived: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          brand_ids: string[] | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          brand_ids?: string[] | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          brand_ids?: string[] | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          brand_id: string
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          public_url: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          brand_id: string | null
          created_at: string
          id: string
          message: string
          post_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          message: string
          post_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          message?: string
          post_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          comments: number
          fetched_at: string
          id: string
          impressions: number
          likes: number
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string
          reach: number
          shares: number
        }
        Insert: {
          comments?: number
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string
          reach?: number
          shares?: number
        }
        Update: {
          comments?: number
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          platform?: Database["public"]["Enums"]["platform_type"]
          post_id?: string
          reach?: number
          shares?: number
        }
        Relationships: []
      }
      post_platform_attempts: {
        Row: {
          attempt_count: number
          content_override: string | null
          created_at: string
          external_post_id: string | null
          external_url: string | null
          hashtags_override: string[] | null
          id: string
          last_error: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string
          posted_manually: boolean
          published_at: string | null
          status: Database["public"]["Enums"]["platform_attempt_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          content_override?: string | null
          created_at?: string
          external_post_id?: string | null
          external_url?: string | null
          hashtags_override?: string[] | null
          id?: string
          last_error?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          post_id: string
          posted_manually?: boolean
          published_at?: string | null
          status?: Database["public"]["Enums"]["platform_attempt_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          content_override?: string | null
          created_at?: string
          external_post_id?: string | null
          external_url?: string | null
          hashtags_override?: string[] | null
          id?: string
          last_error?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          post_id?: string
          posted_manually?: boolean
          published_at?: string | null
          status?: Database["public"]["Enums"]["platform_attempt_status"]
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          brand_id: string
          content: string
          created_at: string | null
          created_by: string | null
          hashtags: string[] | null
          id: string
          link_url: string | null
          media_urls: string[] | null
          platforms: Database["public"]["Enums"]["platform_type"][] | null
          published_at: string | null
          scheduled_for: string | null
          short_link: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          link_url?: string | null
          media_urls?: string[] | null
          platforms?: Database["public"]["Enums"]["platform_type"][] | null
          published_at?: string | null
          scheduled_for?: string | null
          short_link?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          link_url?: string | null
          media_urls?: string[] | null
          platforms?: Database["public"]["Enums"]["platform_type"][] | null
          published_at?: string | null
          scheduled_for?: string | null
          short_link?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_brand_access: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "creator" | "client"
      platform_attempt_status:
        | "pending"
        | "processing"
        | "published"
        | "needs_manual"
        | "failed"
        | "skipped"
      platform_type:
        | "facebook"
        | "instagram"
        | "threads"
        | "linkedin"
        | "google_business"
        | "x"
      post_status:
        | "draft"
        | "pending_manager"
        | "pending_client"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
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
      app_role: ["admin", "manager", "creator", "client"],
      platform_attempt_status: [
        "pending",
        "processing",
        "published",
        "needs_manual",
        "failed",
        "skipped",
      ],
      platform_type: [
        "facebook",
        "instagram",
        "threads",
        "linkedin",
        "google_business",
        "x",
      ],
      post_status: [
        "draft",
        "pending_manager",
        "pending_client",
        "approved",
        "scheduled",
        "published",
        "rejected",
      ],
    },
  },
} as const
