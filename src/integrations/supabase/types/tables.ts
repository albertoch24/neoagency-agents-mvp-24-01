import { Database } from "./database.types";

type PublicSchema = Database["public"]

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

export interface Tables {
  agents: {
    Row: {
      created_at: string;
      description: string | null;
      id: string;
      name: string;
      updated_at: string;
      user_id: string;
      is_paused: boolean | null;
      voice_id: string | null;
      prompt_template: string | null;
    };
    Insert: {
      created_at?: string;
      description?: string | null;
      id?: string;
      name: string;
      updated_at?: string;
      user_id: string;
      is_paused?: boolean | null;
      voice_id?: string | null;
      prompt_template?: string | null;
    };
    Update: {
      created_at?: string;
      description?: string | null;
      id?: string;
      name?: string;
      updated_at?: string;
      user_id?: string;
      is_paused?: boolean | null;
      voice_id?: string | null;
      prompt_template?: string | null;
    };
  };
  briefs: {
    Row: {
      created_at: string;
      description: string | null;
      id: string;
      objectives: string | null;
      title: string;
      updated_at: string;
      user_id: string;
      current_stage: string;
      status: string;
    };
    Insert: {
      created_at?: string;
      description?: string | null;
      id?: string;
      objectives?: string | null;
      title: string;
      updated_at?: string;
      user_id: string;
      current_stage?: string;
      status?: string;
    };
    Update: {
      created_at?: string;
      description?: string | null;
      id?: string;
      objectives?: string | null;
      title?: string;
      updated_at?: string;
      user_id?: string;
      current_stage?: string;
      status?: string;
    };
  };
  workflow_conversations: {
    Row: {
      id: string;
      brief_id: string;
      stage_id: string;
      agent_id: string;
      content: string;
      created_at: string;
      output_type: string;
      summary: string | null;
      flow_step_id: string | null;
      reprocessing: boolean;
      reprocessed_at: string | null;
      feedback_id: string | null;
      original_conversation_id: string | null;
    };
    Insert: {
      id?: string;
      brief_id: string;
      stage_id: string;
      agent_id: string;
      content: string;
      created_at?: string;
      output_type?: string;
      summary?: string | null;
      flow_step_id?: string | null;
      reprocessing?: boolean;
      reprocessed_at?: string | null;
      feedback_id?: string | null;
      original_conversation_id?: string | null;
    };
    Update: {
      id?: string;
      brief_id?: string;
      stage_id?: string;
      agent_id?: string;
      content?: string;
      created_at?: string;
      output_type?: string;
      summary?: string | null;
      flow_step_id?: string | null;
      reprocessing?: boolean;
      reprocessed_at?: string | null;
      feedback_id?: string | null;
      original_conversation_id?: string | null;
    };
  };
  brief_outputs: {
    Row: {
      id: string;
      brief_id: string;
      stage: string;
      stage_id: string | null;
      content: any;
      created_at: string;
      updated_at: string;
      feedback_id: string | null;
      is_reprocessed: boolean;
      original_output_id: string | null;
      reprocessed_at: string | null;
    };
    Insert: {
      id?: string;
      brief_id: string;
      stage: string;
      stage_id?: string | null;
      content: any;
      created_at?: string;
      updated_at?: string;
      feedback_id?: string | null;
      is_reprocessed?: boolean;
      original_output_id?: string | null;
      reprocessed_at?: string | null;
    };
    Update: {
      id?: string;
      brief_id?: string;
      stage?: string;
      stage_id?: string | null;
      content?: any;
      created_at?: string;
      updated_at?: string;
      feedback_id?: string | null;
      is_reprocessed?: boolean;
      original_output_id?: string | null;
      reprocessed_at?: string | null;
    };
  };
  stages: {
    Row: {
      id: string;
      name: string;
      user_id: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      user_id: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      user_id?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  flow_history: {
    Row: {
      id: string;
      flow_id: string;
      status: string;
      started_at: string;
      completed_at: string | null;
      results: any;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      flow_id: string;
      status?: string;
      started_at?: string;
      completed_at?: string | null;
      results?: any;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      flow_id?: string;
      status?: string;
      started_at?: string;
      completed_at?: string | null;
      results?: any;
      created_at?: string;
      updated_at?: string;
    };
  };
}
