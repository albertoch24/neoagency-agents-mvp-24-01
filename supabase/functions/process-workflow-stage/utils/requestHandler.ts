import { corsHeaders } from './cors.ts';

export interface WorkflowRequest {
  briefId: string;
  stageId: string;
  flowSteps: any[];
  feedbackId?: string | null;
}

export async function validateRequest(req: Request): Promise<WorkflowRequest> {
  if (req.method === 'OPTIONS') {
    throw new Error('CORS preflight');
  }

  const { briefId, stageId, flowSteps, feedbackId } = await req.json();

  if (!briefId || !stageId || !Array.isArray(flowSteps)) {
    throw new Error('Missing required parameters');
  }

  console.log('🔍 Request validation:', {
    briefId,
    stageId,
    flowStepsCount: flowSteps.length,
    hasFeedback: !!feedbackId,
    timestamp: new Date().toISOString()
  });

  return { briefId, stageId, flowSteps, feedbackId };
}