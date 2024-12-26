export interface Skill {
  id: string;
  name: string;
  description: string;
  type: "text" | "document";
  content: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  skills: Skill[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  agents: {
    agentId: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  flowId: string;
  status: "running" | "completed" | "failed";
  outputs: {
    agentId: string;
    output: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}