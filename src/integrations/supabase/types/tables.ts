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
      brief_id: string;
      created_at: string;
      id: string;
      stage_id: string;
      agent_id: string;
      content: string;
      flow_step_id: string | null;
    };
    Insert: {
      brief_id: string;
      created_at?: string;
      id?: string;
      stage_id: string;
      agent_id: string;
      content: string;
      flow_step_id?: string | null;
    };
    Update: {
      brief_id?: string;
      created_at?: string;
      id?: string;
      stage_id?: string;
      agent_id?: string;
      content?: string;
      flow_step_id?: string | null;
    };
  };
  brief_outputs: {
    Row: {
      brief_id: string;
      created_at: string;
      id: string;
      stage: string;
      stage_id: string;
      content: any;
    };
    Insert: {
      brief_id: string;
      created_at?: string;
      id?: string;
      stage: string;
      stage_id: string;
      content: any;
    };
    Update: {
      brief_id?: string;
      created_at?: string;
      id?: string;
      stage?: string;
      stage_id?: string;
      content?: any;
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
  agent_feedback: {
    Row: {
      id: string;
      conversation_id: string;
      reviewer_agent_id: string;
      content: string;
      rating: number | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      conversation_id: string;
      reviewer_agent_id: string;
      content: string;
      rating?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      conversation_id?: string;
      reviewer_agent_id?: string;
      content?: string;
      rating?: number | null;
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
