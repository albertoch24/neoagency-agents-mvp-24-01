export interface Database {
  public: {
    Tables: {
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
          content: any; // Adjust as necessary for your content structure
        };
        Insert: {
          brief_id: string;
          created_at?: string;
          id?: string;
          stage: string;
          stage_id: string;
          content: any; // Adjust as necessary for your content structure
        };
        Update: {
          brief_id?: string;
          created_at?: string;
          id?: string;
          stage?: string;
          stage_id?: string;
          content?: any; // Adjust as necessary for your content structure
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
      // Add other table definitions as needed
    };
  };
}
