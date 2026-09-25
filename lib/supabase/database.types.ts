export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          user_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          user_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          state?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          state?: Json
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
