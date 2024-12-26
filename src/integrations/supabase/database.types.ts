export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
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
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_conversations: {
        Row: {
          id: string
          brief_id: string
          stage_id: string
          agent_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          brief_id: string
          stage_id: string
          agent_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          brief_id?: string
          stage_id?: string
          agent_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_conversations_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      brief_outputs: {
        Row: {
          brief_id: string
          content: Json
          created_at: string
          id: string
          stage: string
          updated_at: string
        }
        Insert: {
          brief_id: string
          content: Json
          created_at?: string
          id?: string
          stage: string
          updated_at?: string
        }
        Update: {
          brief_id?: string
          content?: Json
          created_at?: string
          id?: string
          stage?: string
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
        ]
      }
      briefs: {
        Row: {
          budget: string | null
          created_at: string
          current_stage: string | null
          description: string | null
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
          budget?: string | null
          created_at?: string
          current_stage?: string | null
          description?: string | null
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
          budget?: string | null
          created_at?: string
          current_stage?: string | null
          description?: string | null
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
            foreignKeyName: "briefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_history: {
        Row: {
          completed_at: string | null
          flow_id: string
          id: string
          results: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          flow_id: string
          id?: string
          results?: Json | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          flow_id?: string
          id?: string
          results?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_history_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_steps: {
        Row: {
          agent_id: string
          created_at: string
          flow_id: string
          id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          flow_id: string
          id?: string
          order_index: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          flow_id?: string
          id?: string
          order_index?: number
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