export interface WorkflowRequest {
  briefId: string;
  stageId: string;
  flowId: string;
  flowSteps: any[];
}

export interface Stage {
  id: string;
  name: string;
  flows: {
    id: string;
    flow_steps: {
      id: string;
      agent_id: string;
      agents: {
        id: string;
        name: string;
        skills: any[];
      };
    }[];
  }[];
}

export interface Brief {
  id: string;
  title: string;
  description: string;
  objectives: string;
  current_stage: string;
  status: string;
}