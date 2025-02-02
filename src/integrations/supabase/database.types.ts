export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      briefs: {
        Row: {
          brand: string | null;
          budget: string | null;
          created_at: string;
          current_stage: string | null;
          description: string | null;
          flow_id: string | null;
          id: string;
          language: string;
          objectives: string | null;
          status: string | null;
          target_audience: string | null;
          timeline: string | null;
          title: string;
          updated_at: string;
          user_id: string;
          website: string | null;
          use_langchain: boolean;
        };
        Insert: {
          brand?: string | null;
          budget?: string | null;
          created_at?: string;
          current_stage?: string | null;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          language?: string;
          objectives?: string | null;
          status?: string | null;
          target_audience?: string | null;
          timeline?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
          website?: string | null;
          use_langchain?: boolean;
        };
        Update: {
          brand?: string | null;
          budget?: string | null;
          created_at?: string;
          current_stage?: string | null;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          language?: string;
          objectives?: string | null;
          status?: string | null;
          target_audience?: string | null;
          timeline?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
          use_langchain?: boolean;
        };
      };
      agent_feedback: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          rating: number | null;
          reviewer_agent_id: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          rating?: number | null;
          reviewer_agent_id: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          rating?: number | null;
          reviewer_agent_id?: string;
          updated_at?: string;
        };
      };
      briefs: {
        Row: {
          brand: string | null;
          budget: string | null;
          created_at: string;
          current_stage: string | null;
          description: string | null;
          flow_id: string | null;
          id: string;
          language: string;
          objectives: string | null;
          status: string | null;
          target_audience: string | null;
          timeline: string | null;
          title: string;
          updated_at: string;
          user_id: string;
          website: string | null;
          use_langchain: boolean;
        };
        Insert: {
          brand?: string | null;
          budget?: string | null;
          created_at?: string;
          current_stage?: string | null;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          language?: string;
          objectives?: string | null;
          status?: string | null;
          target_audience?: string | null;
          timeline?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
          website?: string | null;
          use_langchain?: boolean;
        };
        Update: {
          brand?: string | null;
          budget?: string | null;
          created_at?: string;
          current_stage?: string | null;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          language?: string;
          objectives?: string | null;
          status?: string | null;
          target_audience?: string | null;
          timeline?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
          use_langchain?: boolean;
        };
      };
      brief_outputs: {
        Row: {
          brief_id: string;
          content: Json;
          content_format: string | null;
          created_at: string;
          feedback_id: string | null;
          id: string;
          is_reprocessed: boolean | null;
          metadata: Json | null;
          original_output_id: string | null;
          processing_metrics: Json | null;
          reprocessed_at: string | null;
          stage: string;
          stage_id: string | null;
          updated_at: string;
        };
        Insert: {
          brief_id: string;
          content: Json;
          content_format?: string | null;
          created_at?: string;
          feedback_id?: string | null;
          id?: string;
          is_reprocessed?: boolean | null;
          metadata?: Json | null;
          original_output_id?: string | null;
          processing_metrics?: Json | null;
          reprocessed_at?: string | null;
          stage: string;
          stage_id?: string | null;
          updated_at?: string;
        };
        Update: {
          brief_id?: string;
          content?: Json;
          content_format?: string | null;
          created_at?: string;
          feedback_id?: string | null;
          id?: string;
          is_reprocessed?: boolean | null;
          metadata?: Json | null;
          original_output_id?: string | null;
          processing_metrics?: Json | null;
          reprocessed_at?: string | null;
          stage?: string;
          stage_id?: string | null;
          updated_at?: string;
        };
      };
      stages: {
        Row: {
          created_at: string;
          description: string | null;
          flow_id: string | null;
          id: string;
          name: string;
          order_index: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          name: string;
          order_index: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          flow_id?: string | null;
          id?: string;
          name?: string;
          order_index?: number;
          updated_at?: string;
          user_id?: string;
        };
      };
      workflow_conversations: {
        Row: {
          agent_id: string;
          brief_id: string;
          content: string;
          created_at: string;
          feedback_id: string | null;
          feedback_metrics: Json | null;
          flow_step_id: string | null;
          id: string;
          original_conversation_id: string | null;
          output_type: string;
          reprocessed_at: string | null;
          reprocessing: boolean | null;
          stage_id: string;
          streaming_status: string | null;
          summary: string | null;
          version: number | null;
        };
        Insert: {
          agent_id: string;
          brief_id: string;
          content: string;
          created_at?: string;
          feedback_id?: string | null;
          feedback_metrics?: Json | null;
          flow_step_id?: string | null;
          id?: string;
          original_conversation_id?: string | null;
          output_type?: string;
          reprocessed_at?: string | null;
          reprocessing?: boolean | null;
          stage_id: string;
          streaming_status?: string | null;
          summary?: string | null;
          version?: number | null;
        };
        Update: {
          agent_id?: string;
          brief_id?: string;
          content?: string;
          created_at?: string;
          feedback_id?: string | null;
          feedback_metrics?: Json | null;
          flow_step_id?: string | null;
          id?: string;
          original_conversation_id?: string | null;
          output_type?: string;
          reprocessed_at?: string | null;
          reprocessing?: boolean | null;
          stage_id?: string;
          streaming_status?: string | null;
          summary?: string | null;
          version?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
