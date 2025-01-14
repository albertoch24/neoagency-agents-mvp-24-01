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
