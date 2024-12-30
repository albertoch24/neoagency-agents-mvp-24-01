export type WorkflowRole = {
  id: string;
  name: string;
  responsibilities: string[];
};

export type WorkflowStage = {
  id: string;
  name: string;
  icon: string;
  description: string;
  roles: WorkflowRole[];
  outputs: string[];
  completed?: boolean;
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