import { Json } from './common';

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
    };
  };
  brief_outputs: {
    Row: {
      id: string;
      brief_id: string;
      stage: string;
      content: Json;
      created_at: string;
      updated_at: string;
      stage_id: string | null;
    };
    Insert: {
      brief_id: string;
      content: Json;
      created_at?: string;
      id?: string;
      stage: string;
      stage_id?: string | null;
      updated_at?: string;
    };
    Update: {
      brief_id?: string;
      content?: Json;
      created_at?: string;
      id?: string;
      stage?: string;
      stage_id?: string | null;
      updated_at?: string;
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
    };
  };
  flows: {
    Row: {
      created_at: string;
      description: string | null;
      id: string;
      name: string;
      updated_at: string;
      user_id: string;
    };
    Insert: {
      created_at?: string;
      description?: string | null;
      id?: string;
      name: string;
      updated_at?: string;
      user_id: string;
    };
    Update: {
      created_at?: string;
      description?: string | null;
      id?: string;
      name?: string;
      updated_at?: string;
      user_id?: string;
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
  skills: {
    Row: {
      agent_id: string;
      content: string;
      created_at: string;
      description: string | null;
      id: string;
      name: string;
      type: string;
      updated_at: string;
    };
    Insert: {
      agent_id: string;
      content: string;
      created_at?: string;
      description?: string | null;
      id?: string;
      name: string;
      type: string;
      updated_at?: string;
    };
    Update: {
      agent_id?: string;
      content?: string;
      created_at?: string;
      description?: string | null;
      id?: string;
      name?: string;
      type?: string;
      updated_at?: string;
    };
  };
}