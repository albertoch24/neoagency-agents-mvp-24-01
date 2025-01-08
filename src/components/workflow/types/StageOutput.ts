export interface Output {
  content: string;
  type: string;
}

export interface AgentOutput {
  agent: string;
  requirements?: string;
  outputs: Output[];
  stepId: string;
  orderIndex: number;
}

export interface StageOutput {
  stage_name: string;
  flow_name: string;
  agent_count: number;
  outputs: AgentOutput[];
}

export function isStageOutput(obj: any): obj is StageOutput {
  if (!obj || typeof obj !== 'object') {
    console.log("Invalid output object:", obj);
    return false;
  }

  const hasRequiredFields = 
    'stage_name' in obj &&
    'flow_name' in obj &&
    'agent_count' in obj &&
    'outputs' in obj;

  if (!hasRequiredFields) {
    console.log("Missing required fields:", {
      hasStage: 'stage_name' in obj,
      hasFlow: 'flow_name' in obj,
      hasCount: 'agent_count' in obj,
      hasOutputs: 'outputs' in obj
    });
    return false;
  }

  if (!Array.isArray(obj.outputs)) {
    console.log("Outputs is not an array:", obj.outputs);
    return false;
  }

  return true;
}