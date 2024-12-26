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
}

export interface Flow {
  id: string;
  name: string;
  description: string | null;
  agents: {
    agentId: string;
    order: number;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  userId: string;
  flowId: string;
  status: "running" | "completed" | "failed";
  outputs: {
    agentId: string;
    output: string;
    timestamp: string;
  }[];
  created_at: string;
  updated_at: string;
}