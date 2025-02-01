export interface Skill {
  id: string;
  name: string;
  description: string | null;
  type: string;
  content: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  skills: Skill[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_paused: boolean | null;
  prompt_template: string | null;
}