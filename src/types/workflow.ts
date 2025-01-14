export type WorkflowRole = {
  id: string;
  name: string;
  responsibilities: string[];
};

export type Stage = {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  user_id: string;
  flow_id: string | null;
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
      agents?: {
        id: string;
        name: string;
        description: string;
      };
    }>;
  } | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowState = {
  currentStage: string;
  stages: Record<string, Stage>;
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
  feedback_id: string | null;
  is_reprocessed: boolean;
  original_output_id: string | null;
  reprocessed_at: string | null;
};