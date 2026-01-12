export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      algorithm_case_study_relations: {
        Row: {
          algorithm_id: string | null
          case_study_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          algorithm_id?: string | null
          case_study_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          algorithm_id?: string | null
          case_study_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_case_study_relations_algorithm_id_fkey"
            columns: ["algorithm_id"]
            isOneToOne: false
            referencedRelation: "algorithms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algorithm_case_study_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      algorithm_industry_relations: {
        Row: {
          algorithm_id: string | null
          created_at: string | null
          id: string
          industry_id: string | null
        }
        Insert: {
          algorithm_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
        }
        Update: {
          algorithm_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_industry_relations_algorithm_id_fkey"
            columns: ["algorithm_id"]
            isOneToOne: false
            referencedRelation: "algorithms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "algorithm_industry_relations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      algorithms: {
        Row: {
          academic_references: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_system_record: boolean | null
          main_content: string | null
          name: string
          published: boolean | null
          published_at: string | null
          quantum_advantage: string | null
          slug: string
          steps: string | null
          ts_content: unknown | null
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          academic_references?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name: string
          published?: boolean | null
          published_at?: string | null
          quantum_advantage?: string | null
          slug: string
          steps?: string | null
          ts_content?: unknown | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          academic_references?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name?: string
          published?: boolean | null
          published_at?: string | null
          quantum_advantage?: string | null
          slug?: string
          steps?: string | null
          ts_content?: unknown | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      blog_post_relations: {
        Row: {
          blog_post_id: string | null
          created_at: string | null
          id: string
          related_blog_post_id: string | null
          relation_type: string
        }
        Insert: {
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          related_blog_post_id?: string | null
          relation_type: string
        }
        Update: {
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          related_blog_post_id?: string | null
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_relations_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_relations_related_blog_post_id_fkey"
            columns: ["related_blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          featured: boolean | null
          featured_image: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          ts_content: unknown | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          academic_references: string | null
          algorithms: string[] | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          featured: boolean | null
          id: string
          import_batch_id: string | null
          import_batch_name: string | null
          import_source: string | null
          import_timestamp: string | null
          main_content: string | null
          original_qookie_id: string | null
          original_qookie_slug: string | null
          published: boolean | null
          published_at: string | null
          resource_links: Json | null
          slug: string
          title: string
          updated_at: string | null
          year: number
        }
        Insert: {
          academic_references?: string | null
          algorithms?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          import_batch_id?: string | null
          import_batch_name?: string | null
          import_source?: string | null
          import_timestamp?: string | null
          main_content?: string | null
          original_qookie_id?: string | null
          original_qookie_slug?: string | null
          published?: boolean | null
          published_at?: string | null
          resource_links?: Json | null
          slug: string
          title: string
          updated_at?: string | null
          year?: number
        }
        Update: {
          academic_references?: string | null
          algorithms?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          import_batch_id?: string | null
          import_batch_name?: string | null
          import_source?: string | null
          import_timestamp?: string | null
          main_content?: string | null
          original_qookie_id?: string | null
          original_qookie_slug?: string | null
          published?: boolean | null
          published_at?: string | null
          resource_links?: Json | null
          slug?: string
          title?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      case_study_industry_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          id: string
          industry_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_industry_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_industry_relations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_partner_company_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          partner_company_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          partner_company_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          partner_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_partner_company_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_partner_company_relations_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_persona_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          id: string
          persona_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          persona_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_persona_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_persona_relations_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_quantum_company_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          quantum_company_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_quantum_company_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_quantum_company_relations_quantum_company_id_fkey"
            columns: ["quantum_company_id"]
            isOneToOne: false
            referencedRelation: "quantum_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_quantum_hardware_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          quantum_hardware_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_hardware_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_hardware_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_quantum_hardware_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_quantum_hardware_relations_quantum_hardware_id_fkey"
            columns: ["quantum_hardware_id"]
            isOneToOne: false
            referencedRelation: "quantum_hardware"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_quantum_software_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          quantum_software_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_software_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_software_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_quantum_software_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_quantum_software_relations_quantum_software_id_fkey"
            columns: ["quantum_software_id"]
            isOneToOne: false
            referencedRelation: "quantum_software"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_relations: {
        Row: {
          case_study_id: string | null
          created_at: string | null
          id: string
          related_case_study_id: string | null
          relation_type: string
        }
        Insert: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          related_case_study_id?: string | null
          relation_type: string
        }
        Update: {
          case_study_id?: string | null
          created_at?: string | null
          id?: string
          related_case_study_id?: string | null
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_study_relations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_relations_related_case_study_id_fkey"
            columns: ["related_case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_audit_log: {
        Row: {
          id: string
          content_type: string
          content_id: string
          content_name: string | null
          action: string
          performed_by: string
          performed_at: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          content_type: string
          content_id: string
          content_name?: string | null
          action: string
          performed_by: string
          performed_at?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: string
          content_id?: string
          content_name?: string | null
          action?: string
          performed_by?: string
          performed_at?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_system_record: boolean | null
          main_content: string | null
          name: string
          published: boolean | null
          published_at: string | null
          sector: string[] | null
          slug: string
          ts_content: unknown | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name: string
          published?: boolean | null
          published_at?: string | null
          sector?: string[] | null
          slug: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name?: string
          published?: boolean | null
          published_at?: string | null
          sector?: string[] | null
          slug?: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Relationships: []
      }
      legacy_tags_backup: {
        Row: {
          created_at: string | null
          id: string | null
          partner_companies: string[] | null
          quantum_companies: string[] | null
          quantum_hardware: string[] | null
          quantum_software: string[] | null
          slug: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          partner_companies?: string[] | null
          quantum_companies?: string[] | null
          quantum_hardware?: string[] | null
          quantum_software?: string[] | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          partner_companies?: string[] | null
          quantum_companies?: string[] | null
          quantum_hardware?: string[] | null
          quantum_software?: string[] | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      partner_companies: {
        Row: {
          company_size: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          headquarters: string | null
          id: string
          industry: string | null
          is_system_record: boolean | null
          linkedin_url: string | null
          main_content: string | null
          name: string
          partnership_type: string | null
          published: boolean | null
          published_at: string | null
          quantum_initiatives: string | null
          slug: string
          ts_content: unknown | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_system_record?: boolean | null
          linkedin_url?: string | null
          main_content?: string | null
          name: string
          partnership_type?: string | null
          published?: boolean | null
          published_at?: string | null
          quantum_initiatives?: string | null
          slug: string
          ts_content?: unknown | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_system_record?: boolean | null
          linkedin_url?: string | null
          main_content?: string | null
          name?: string
          partnership_type?: string | null
          published?: boolean | null
          published_at?: string | null
          quantum_initiatives?: string | null
          slug?: string
          ts_content?: unknown | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      persona_algorithm_relations: {
        Row: {
          algorithm_id: string
          created_at: string
          persona_id: string
        }
        Insert: {
          algorithm_id: string
          created_at?: string
          persona_id: string
        }
        Update: {
          algorithm_id?: string
          created_at?: string
          persona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_algorithm_relations_algorithm_id_fkey"
            columns: ["algorithm_id"]
            isOneToOne: false
            referencedRelation: "algorithms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_algorithm_relations_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_industry_relations: {
        Row: {
          created_at: string | null
          id: string
          industry_id: string | null
          persona_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_id?: string | null
          persona_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_id?: string | null
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_industry_relations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_industry_relations_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          expertise: string[] | null
          id: string
          is_system_record: boolean | null
          main_content: string | null
          name: string
          published: boolean | null
          published_at: string | null
          recommended_reading: string | null
          slug: string
          ts_content: unknown | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          expertise?: string[] | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name: string
          published?: boolean | null
          published_at?: string | null
          recommended_reading?: string | null
          slug: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          expertise?: string[] | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name?: string
          published?: boolean | null
          published_at?: string | null
          recommended_reading?: string | null
          slug?: string
          ts_content?: unknown | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quantum_companies: {
        Row: {
          company_type: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          founded_year: number | null
          funding_stage: string | null
          headquarters: string | null
          id: string
          is_system_record: boolean | null
          key_partnerships: string[] | null
          key_products: string[] | null
          linkedin_url: string | null
          main_content: string | null
          name: string
          published: boolean | null
          published_at: string | null
          slug: string
          ts_content: unknown | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          is_system_record?: boolean | null
          key_partnerships?: string[] | null
          key_products?: string[] | null
          linkedin_url?: string | null
          main_content?: string | null
          name: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          ts_content?: unknown | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          is_system_record?: boolean | null
          key_partnerships?: string[] | null
          key_products?: string[] | null
          linkedin_url?: string | null
          main_content?: string | null
          name?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          ts_content?: unknown | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      quantum_company_hardware_relations: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          quantum_company_id: string | null
          quantum_hardware_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
          quantum_hardware_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
          quantum_hardware_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quantum_company_hardware_relations_quantum_company_id_fkey"
            columns: ["quantum_company_id"]
            isOneToOne: false
            referencedRelation: "quantum_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quantum_company_hardware_relations_quantum_hardware_id_fkey"
            columns: ["quantum_hardware_id"]
            isOneToOne: false
            referencedRelation: "quantum_hardware"
            referencedColumns: ["id"]
          },
        ]
      }
      quantum_company_software_relations: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          quantum_company_id: string | null
          quantum_software_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
          quantum_software_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          quantum_company_id?: string | null
          quantum_software_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quantum_company_software_relations_quantum_company_id_fkey"
            columns: ["quantum_company_id"]
            isOneToOne: false
            referencedRelation: "quantum_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quantum_company_software_relations_quantum_software_id_fkey"
            columns: ["quantum_software_id"]
            isOneToOne: false
            referencedRelation: "quantum_software"
            referencedColumns: ["id"]
          },
        ]
      }
      quantum_hardware: {
        Row: {
          access_model: string | null
          availability: string | null
          coherence_time: string | null
          connectivity: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          documentation_url: string | null
          gate_fidelity: number | null
          id: string
          is_system_record: boolean | null
          main_content: string | null
          name: string
          published: boolean | null
          published_at: string | null
          qubit_count: number | null
          slug: string
          technology_type: string | null
          ts_content: unknown | null
          updated_at: string | null
          vendor: string | null
          website_url: string | null
        }
        Insert: {
          access_model?: string | null
          availability?: string | null
          coherence_time?: string | null
          connectivity?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documentation_url?: string | null
          gate_fidelity?: number | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name: string
          published?: boolean | null
          published_at?: string | null
          qubit_count?: number | null
          slug: string
          technology_type?: string | null
          ts_content?: unknown | null
          updated_at?: string | null
          vendor?: string | null
          website_url?: string | null
        }
        Update: {
          access_model?: string | null
          availability?: string | null
          coherence_time?: string | null
          connectivity?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documentation_url?: string | null
          gate_fidelity?: number | null
          id?: string
          is_system_record?: boolean | null
          main_content?: string | null
          name?: string
          published?: boolean | null
          published_at?: string | null
          qubit_count?: number | null
          slug?: string
          technology_type?: string | null
          ts_content?: unknown | null
          updated_at?: string | null
          vendor?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      quantum_software: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          documentation_url: string | null
          github_url: string | null
          id: string
          is_system_record: boolean | null
          license_type: string | null
          main_content: string | null
          name: string
          pricing_model: string | null
          programming_languages: string[] | null
          published: boolean | null
          published_at: string | null
          slug: string
          supported_hardware: string[] | null
          ts_content: unknown | null
          updated_at: string | null
          vendor: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documentation_url?: string | null
          github_url?: string | null
          id?: string
          is_system_record?: boolean | null
          license_type?: string | null
          main_content?: string | null
          name: string
          pricing_model?: string | null
          programming_languages?: string[] | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          supported_hardware?: string[] | null
          ts_content?: unknown | null
          updated_at?: string | null
          vendor?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documentation_url?: string | null
          github_url?: string | null
          id?: string
          is_system_record?: boolean | null
          license_type?: string | null
          main_content?: string | null
          name?: string
          pricing_model?: string | null
          programming_languages?: string[] | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          supported_hardware?: string[] | null
          ts_content?: unknown | null
          updated_at?: string | null
          vendor?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      stack_layers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          parent_layer_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          parent_layer_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          parent_layer_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stack_layers_parent_layer_id_fkey"
            columns: ["parent_layer_id"]
            isOneToOne: false
            referencedRelation: "stack_layers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_preferences: Json | null
          id: string
          role: string | null
          theme_preference: string | null
          ui_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_preferences?: Json | null
          id: string
          role?: string | null
          theme_preference?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_preferences?: Json | null
          id?: string
          role?: string | null
          theme_preference?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_slug: {
        Args: { name_text: string }
        Returns: string
      }
      recover_content: {
        Args: { content_id: string; table_name: string }
        Returns: boolean
      }
      setup_admin_role: {
        Args: { admin_email: string }
        Returns: undefined
      }
      soft_delete_content: {
        Args: {
          content_id: string
          deleted_by_user?: string
          table_name: string
        }
        Returns: boolean
      }
      verify_initial_setup: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

