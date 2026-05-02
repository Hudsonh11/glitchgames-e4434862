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
      achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          activity_type: string
          content: string
          created_at: string
          game_id: string | null
          id: string
          related_user_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          content: string
          created_at?: string
          game_id?: string | null
          id?: string
          related_user_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          content?: string
          created_at?: string
          game_id?: string | null
          id?: string
          related_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          author_id: string
          content: string
          created_at: string
          id: string
          priority: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          content: string
          created_at?: string
          id?: string
          priority?: number
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          priority?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      battle_pass_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          season: string
          status: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          season?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          season?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          browser_info: string | null
          category: string
          created_at: string
          description: string
          email: string | null
          id: string
          page_url: string | null
          resolved_at: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          browser_info?: string | null
          category: string
          created_at?: string
          description: string
          email?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          browser_info?: string | null
          category?: string
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenged_id: string
          challenged_score: number | null
          challenger_id: string
          challenger_score: number | null
          completed_at: string | null
          created_at: string
          game_id: string
          id: string
          status: string
          wager_coins: number | null
          winner_id: string | null
        }
        Insert: {
          challenged_id: string
          challenged_score?: number | null
          challenger_id: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          game_id: string
          id?: string
          status?: string
          wager_coins?: number | null
          winner_id?: string | null
        }
        Update: {
          challenged_id?: string
          challenged_score?: number | null
          challenger_id?: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          game_id?: string
          id?: string
          status?: string
          wager_coins?: number | null
          winner_id?: string | null
        }
        Relationships: []
      }
      clan_chat: {
        Row: {
          clan_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clan_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_chat_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          owner_id: string
          tag: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          owner_id: string
          tag: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          owner_id?: string
          tag?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          id: string
          last_claim_date: string | null
          streak: number
          user_id: string
        }
        Insert: {
          id?: string
          last_claim_date?: string | null
          streak?: number
          user_id: string
        }
        Update: {
          id?: string
          last_claim_date?: string | null
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_config: {
        Row: {
          config: Json
          difficulty: string
          enabled: boolean
          game_id: string
          id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          difficulty?: string
          enabled?: boolean
          game_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          difficulty?: string
          enabled?: boolean
          game_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      game_stats: {
        Row: {
          created_at: string
          game_id: string
          games_played: number
          high_score: number
          id: string
          total_time_played: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          games_played?: number
          high_score?: number
          id?: string
          total_time_played?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          games_played?: number
          high_score?: number
          id?: string
          total_time_played?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      party_lobbies: {
        Row: {
          created_at: string
          game_id: string
          host_id: string
          id: string
          max_players: number
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          game_id: string
          host_id: string
          id?: string
          max_players?: number
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          host_id?: string
          id?: string
          max_players?: number
          name?: string
          status?: string
        }
        Relationships: []
      }
      party_members: {
        Row: {
          id: string
          joined_at: string
          lobby_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          lobby_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          lobby_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_members_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "party_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      player_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_borders: {
        Row: {
          border_id: string
          equipped: boolean
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          border_id: string
          equipped?: boolean
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          border_id?: string
          equipped?: boolean
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_status: {
        Row: {
          current_game: string | null
          id: string
          last_seen: string
          status: string
          user_id: string
        }
        Insert: {
          current_game?: string | null
          id?: string
          last_seen?: string
          status?: string
          user_id: string
        }
        Update: {
          current_game?: string | null
          id?: string
          last_seen?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      player_themes: {
        Row: {
          equipped: boolean
          id: string
          theme_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          theme_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          equipped?: boolean
          id?: string
          theme_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_titles: {
        Row: {
          equipped: boolean
          id: string
          title_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          title_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          equipped?: boolean
          id?: string
          title_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          coins: number
          created_at: string
          gems: number
          id: string
          level: number
          updated_at: string
          user_id: string
          username: string
          xp: number
        }
        Insert: {
          avatar?: string | null
          coins?: number
          created_at?: string
          gems?: number
          id?: string
          level?: number
          updated_at?: string
          user_id: string
          username: string
          xp?: number
        }
        Update: {
          avatar?: string | null
          coins?: number
          created_at?: string
          gems?: number
          id?: string
          level?: number
          updated_at?: string
          user_id?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      quests: {
        Row: {
          active: boolean
          created_at: string
          description: string
          goal_target: number
          goal_type: string
          id: string
          quest_key: string
          quest_type: string
          reward_coins: number
          reward_gems: number
          reward_xp: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          goal_target?: number
          goal_type: string
          id?: string
          quest_key: string
          quest_type?: string
          reward_coins?: number
          reward_gems?: number
          reward_xp?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          goal_target?: number
          goal_type?: string
          id?: string
          quest_key?: string
          quest_type?: string
          reward_coins?: number
          reward_gems?: number
          reward_xp?: number
          title?: string
        }
        Relationships: []
      }
      ranked_stats: {
        Row: {
          best_win_streak: number
          created_at: string
          game_id: string
          id: string
          losses: number
          rank_points: number
          rank_tier: string
          updated_at: string
          user_id: string
          win_streak: number
          wins: number
        }
        Insert: {
          best_win_streak?: number
          created_at?: string
          game_id: string
          id?: string
          losses?: number
          rank_points?: number
          rank_tier?: string
          updated_at?: string
          user_id: string
          win_streak?: number
          wins?: number
        }
        Update: {
          best_win_streak?: number
          created_at?: string
          game_id?: string
          id?: string
          losses?: number
          rank_points?: number
          rank_tier?: string
          updated_at?: string
          user_id?: string
          win_streak?: number
          wins?: number
        }
        Relationships: []
      }
      scheduled_maintenance: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          id: string
          message: string | null
          starts_at: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at: string
          id?: string
          message?: string | null
          starts_at: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          message?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string
          score: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          score?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          score?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          ends_at: string | null
          game_id: string
          id: string
          max_participants: number
          name: string
          prize_coins: number
          prize_gems: number
          starts_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          game_id: string
          id?: string
          max_participants?: number
          name: string
          prize_coins?: number
          prize_gems?: number
          starts_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          game_id?: string
          id?: string
          max_participants?: number
          name?: string
          prize_coins?: number
          prize_gems?: number
          starts_at?: string | null
          status?: string
        }
        Relationships: []
      }
      user_prestige: {
        Row: {
          coin_multiplier: number
          created_at: string
          id: string
          last_prestige_at: string | null
          prestige_level: number
          total_resets: number
          updated_at: string
          user_id: string
          xp_multiplier: number
        }
        Insert: {
          coin_multiplier?: number
          created_at?: string
          id?: string
          last_prestige_at?: string | null
          prestige_level?: number
          total_resets?: number
          updated_at?: string
          user_id: string
          xp_multiplier?: number
        }
        Update: {
          coin_multiplier?: number
          created_at?: string
          id?: string
          last_prestige_at?: string | null
          prestige_level?: number
          total_resets?: number
          updated_at?: string
          user_id?: string
          xp_multiplier?: number
        }
        Relationships: []
      }
      user_quest_progress: {
        Row: {
          claimed: boolean
          completed_at: string | null
          created_at: string
          id: string
          period_start: string
          progress: number
          quest_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start?: string
          progress?: number
          quest_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start?: string
          progress?: number
          quest_key?: string
          updated_at?: string
          user_id?: string
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
