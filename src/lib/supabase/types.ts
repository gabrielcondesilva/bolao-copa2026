Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bracket_overrides: {
        Row: {
          away_team_id: string | null
          created_at: string
          home_team_id: string | null
          id: string
          match_slot: number
          phase: Database["public"]["Enums"]["phase"]
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          match_slot: number
          phase: Database["public"]["Enums"]["phase"]
        }
        Update: {
          away_team_id?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          match_slot?: number
          phase?: Database["public"]["Enums"]["phase"]
        }
        Relationships: [
          {
            foreignKeyName: "bracket_overrides_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_overrides_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      classifier_overrides: {
        Row: {
          created_at: string
          id: string
          ordered_team_ids: string[]
          phase: Database["public"]["Enums"]["phase"]
        }
        Insert: {
          created_at?: string
          id?: string
          ordered_team_ids: string[]
          phase: Database["public"]["Enums"]["phase"]
        }
        Update: {
          created_at?: string
          id?: string
          ordered_team_ids?: string[]
          phase?: Database["public"]["Enums"]["phase"]
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string
          external_id: number | null
          group: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          is_finished: boolean
          phase: Database["public"]["Enums"]["phase"]
          scheduled_at: string
          stadium: string | null
          went_to_extra_time: boolean
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id?: number | null
          group?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_finished?: boolean
          phase: Database["public"]["Enums"]["phase"]
          scheduled_at: string
          stadium?: string | null
          went_to_extra_time?: boolean
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id?: number | null
          group?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_finished?: boolean
          phase?: Database["public"]["Enums"]["phase"]
          scheduled_at?: string
          stadium?: string | null
          went_to_extra_time?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      palpites_finais: {
        Row: {
          artilheiro_correct: boolean
          best_player: string | null
          best_player_correct: boolean
          champion_team_id: string | null
          created_at: string
          fourth_team_id: string | null
          id: string
          runner_up_team_id: string | null
          third_team_id: string | null
          top_scorer: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artilheiro_correct?: boolean
          best_player?: string | null
          best_player_correct?: boolean
          champion_team_id?: string | null
          created_at?: string
          fourth_team_id?: string | null
          id?: string
          runner_up_team_id?: string | null
          third_team_id?: string | null
          top_scorer?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artilheiro_correct?: boolean
          best_player?: string | null
          best_player_correct?: boolean
          champion_team_id?: string | null
          created_at?: string
          fourth_team_id?: string | null
          id?: string
          runner_up_team_id?: string | null
          third_team_id?: string | null
          top_scorer?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_finais_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_finais_fourth_team_id_fkey"
            columns: ["fourth_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_finais_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_finais_third_team_id_fkey"
            columns: ["third_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_finais_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      palpites_jogos: {
        Row: {
          away_score: number | null
          created_at: string
          home_score: number | null
          id: string
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score?: number | null
          created_at?: string
          home_score?: number | null
          id?: string
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number | null
          created_at?: string
          home_score?: number | null
          id?: string
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_jogos_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_jogos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_exceptions: {
        Row: {
          created_at: string
          id: string
          phase: Database["public"]["Enums"]["phase"]
          unlocked_until: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phase: Database["public"]["Enums"]["phase"]
          unlocked_until: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["phase"]
          unlocked_until?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_exceptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_deadlines: {
        Row: {
          deadline_at: string
          id: string
          phase: Database["public"]["Enums"]["phase"]
        }
        Insert: {
          deadline_at: string
          id?: string
          phase: Database["public"]["Enums"]["phase"]
        }
        Update: {
          deadline_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["phase"]
        }
        Relationships: []
      }
      teams: {
        Row: {
          country_code: string
          created_at: string
          external_id: number | null
          fifa_ranking_reference: number
          group: string
          id: string
          name: string
        }
        Insert: {
          country_code: string
          created_at?: string
          external_id?: number | null
          fifa_ranking_reference: number
          group: string
          id?: string
          name: string
        }
        Update: {
          country_code?: string
          created_at?: string
          external_id?: number | null
          fifa_ranking_reference?: number
          group?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      phase:
        | "group_stage"
        | "round_of_32"
        | "round_of_16"
        | "quarterfinals"
        | "semifinals"
        | "third_place"
        | "final"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      phase: [
        "group_stage",
        "round_of_32",
        "round_of_16",
        "quarterfinals",
        "semifinals",
        "third_place",
        "final",
      ],
    },
  },
} as const
