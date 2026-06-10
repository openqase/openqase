export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      algorithms: {
        Row: {
          id: string
          name: string
          description: string | null
          published: boolean | null
          published_at: string | null
          main_content: string | null
          metadata: Json | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      algorithm_industry_relations: {
        Row: {
          algorithm_id: string
          industry_id: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
