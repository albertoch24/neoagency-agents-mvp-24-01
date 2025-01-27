export interface Agent {
  id: string;
  name: string;
  description: string | null;
  prompt_template?: string | null;
  skills: Skill[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_paused: boolean | null;
  voice_id: string | null;
}
