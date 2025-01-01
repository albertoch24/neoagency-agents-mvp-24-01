import { WorkflowRequest, Stage, Brief } from './types.ts';
import { corsHeaders } from './cors.ts';

export async function validateRequest(req: Request): Promise<WorkflowRequest> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { briefId, stageId, flowId, flowSteps } = await req.json();
  
  console.log("Validating request parameters:", { briefId, stageId, flowId });
  
  const missingParams = [];
  if (!briefId) missingParams.push('briefId');
  if (!stageId) missingParams.push('stageId');
  if (!flowId) missingParams.push('flowId');
  if (!flowSteps) missingParams.push('flowSteps');

  if (missingParams.length > 0) {
    console.error("Missing required parameters:", missingParams);
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  return { briefId, stageId, flowId, flowSteps };
}

export async function validateStage(supabase: any, stageId: string): Promise<Stage> {
  console.log("Validating stage:", stageId);
  
  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select(`
      *,
      flows (
        id,
        flow_steps (
          id,
          agent_id,
          agents (
            id,
            name,
            skills (*)
          )
        )
      )
    `)
    .eq("id", stageId)
    .maybeSingle();

  if (stageError || !stage) {
    console.error("Stage validation failed:", stageError || "Stage not found");
    throw new Error("Stage not found or invalid");
  }

  console.log("Stage validation successful:", {
    stageId: stage.id,
    stageName: stage.name,
    flowId: stage.flow_id
  });

  return stage;
}

export async function validateBrief(supabase: any, briefId: string): Promise<Brief> {
  console.log("Validating brief:", briefId);
  
  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", briefId)
    .single();

  if (briefError || !brief) {
    console.error("Brief validation failed:", briefError || "Brief not found");
    throw new Error("Brief not found");
  }

  console.log("Brief validation successful:", {
    briefId: brief.id,
    title: brief.title,
    currentStage: brief.current_stage
  });

  return brief;
}