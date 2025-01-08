export type WorkflowRole = {
  id: string;
  name: string;
  responsibilities: string[];
};

export type WorkflowStage = {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  user_id: string;
  flow_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Stage = {
  id: string;
  name: string;
  description?: string | null;
  order_index?: number;
  user_id?: string;
  flow_id?: string | null;
  flows?: {
    id: string;
    name: string;
    description?: string;
    flow_steps?: Array<{
      id: string;
      agent_id: string;
      requirements: string;
      order_index: number;
      outputs: any[];
      description?: string;
    }>;
  };
  created_at?: string;
  updated_at?: string;
};

export type WorkflowState = {
  currentStage: string;
  stages: Record<string, WorkflowStage>;
};

export type WorkflowOutputContent = {
  stage_name?: string;
  flow_name?: string;
  agent_count?: number;
  response?: string;
  outputs?: Array<{
    agent: string;
    requirements?: string;
    outputs?: Array<{ text: string }>;
  }>;
  [key: string]: any;
};

export type BriefOutput = {
  id: string;
  brief_id: string;
  stage: string;
  stage_id: string | null;
  content: WorkflowOutputContent;
  created_at: string;
  updated_at: string;
};