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