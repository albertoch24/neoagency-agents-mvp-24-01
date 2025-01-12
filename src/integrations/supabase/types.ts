export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_feedback: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          rating: number | null
          reviewer_agent_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_agent_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_agent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "workflow_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_feedback_reviewer_agent_id_fkey"
            columns: ["reviewer_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_paused: boolean | null
          name: string
          temperature: number | null
          updated_at: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_paused?: boolean | null
          name: string
          temperature?: number | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_paused?: boolean | null
          name?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_knowledge: {
        Row: {
          brand: string
          brief_id: string | null
          content: Json
          created_at: string
          id: string
          stage_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          brand: string
          brief_id?: string | null
          content: Json
          created_at?: string
          id?: string
          stage_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          brand?: string
          brief_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          stage_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_knowledge_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_knowledge_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_outputs: {
        Row: {
          brief_id: string
          content: Json
          created_at: string
          id: string
          stage: string
          stage_id: string | null
          updated_at: string
        }
        Insert: {
          brief_id: string
          content: Json
          created_at?: string
          id?: string
          stage: string
          stage_id?: string | null
          updated_at?: string
        }
        Update: {
          brief_id?: string
          content?: Json
          created_at?: string
          id?: string
          stage?: string
          stage_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_outputs_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_outputs_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          brand: string | null
          budget: string | null
          created_at: string
          current_stage: string | null
          description: string | null
          flow_id: string | null
          id: string
          objectives: string | null
          status: string | null
          target_audience: string | null
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          budget?: string | null
          created_at?: string
          current_stage?: string | null
          description?: string | null
          flow_id?: string | null
          id?: string
          objectives?: string | null
          status?: string | null
          target_audience?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          budget?: string | null
          created_at?: string
          current_stage?: string | null
          description?: string | null
          flow_id?: string | null
          id?: string
          objectives?: string | null
          status?: string | null
          target_audience?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      flow_history: {
        Row: {
          completed_at: string | null
          flow_id: string
          id: string
          results: Json | null
          started_at: string
          status: string
          step_id: string | null
        }
        Insert: {
          completed_at?: string | null
          flow_id: string
          id?: string
          results?: Json | null
          started_at?: string
          status: string
          step_id?: string | null
        }
        Update: {
          completed_at?: string | null
          flow_id?: string
          id?: string
          results?: Json | null
          started_at?: string
          status?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_history_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_history_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_steps: {
        Row: {
          agent_id: string
          created_at: string
          description: string | null
          flow_id: string
          id: string
          order_index: number
          outputs: Json[] | null
          requirements: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string | null
          flow_id: string
          id?: string
          order_index: number
          outputs?: Json[] | null
          requirements?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string | null
          flow_id?: string
          id?: string
          order_index?: number
          outputs?: Json[] | null
          requirements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_steps_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flows_user_id_fkey"
            columns: ["user_id"]
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
          id: string
          is_admin: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string
          id: string
          name: string
          secret: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          secret: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          secret?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_clarifications: {
        Row: {
          agent_id: string
          answer: string | null
          brief_id: string
          created_at: string
          id: string
          question: string
          stage_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          answer?: string | null
          brief_id: string
          created_at?: string
          id?: string
          question: string
          stage_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          answer?: string | null
          brief_id?: string
          created_at?: string
          id?: string
          question?: string
          stage_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_clarifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_clarifications_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_clarifications_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_feedback: {
        Row: {
          brief_id: string
          content: string
          created_at: string
          id: string
          rating: number | null
          requires_revision: boolean | null
          stage_id: string
          updated_at: string
        }
        Insert: {
          brief_id: string
          content: string
          created_at?: string
          id?: string
          rating?: number | null
          requires_revision?: boolean | null
          stage_id: string
          updated_at?: string
        }
        Update: {
          brief_id?: string
          content?: string
          created_at?: string
          id?: string
          rating?: number | null
          requires_revision?: boolean | null
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_feedback_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_feedback_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string
          description: string | null
          flow_id: string | null
          id: string
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flow_id?: string | null
          id?: string
          name: string
          order_index: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flow_id?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_conversations: {
        Row: {
          agent_id: string
          brief_id: string
          content: string
          created_at: string
          flow_step_id: string | null
          id: string
          output_type: string
          reprocessed_at: string | null
          reprocessing: boolean | null
          stage_id: string
          summary: string | null
        }
        Insert: {
          agent_id: string
          brief_id: string
          content: string
          created_at?: string
          flow_step_id?: string | null
          id?: string
          output_type?: string
          reprocessed_at?: string | null
          reprocessing?: boolean | null
          stage_id: string
          summary?: string | null
        }
        Update: {
          agent_id?: string
          brief_id?: string
          content?: string
          created_at?: string
          flow_step_id?: string | null
          id?: string
          output_type?: string
          reprocessed_at?: string | null
          reprocessing?: boolean | null
          stage_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_flow_step_id_fkey"
            columns: ["flow_step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      delete_agent_with_relations: {
        Args: {
          agent_id_param: string
        }
        Returns: undefined
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
