import { WorkflowRequest, Stage, Brief } from './types.ts';
import { corsHeaders } from './cors.ts';

export async function validateRequest(req: Request): Promise<WorkflowRequest> {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} is not allowed`);
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const body = await req.json();
    const { briefId, stageId, flowId, flowSteps } = body;
    
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
  } catch (error) {
    console.error("Request validation error:", error);
    throw error;
  }
}

export async function validateStage(supabase: any, stageId: string): Promise<Stage> {
  console.log("Validating stage:", stageId);
  
  try {
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
      throw new Error(stageError?.message || "Stage not found or invalid");
    }

    console.log("Stage validation successful:", {
      stageId: stage.id,
      stageName: stage.name,
      flowId: stage.flow_id
    });

    return stage;
  } catch (error) {
    console.error("Stage validation error:", error);
    throw error;
  }
}

export async function validateBrief(supabase: any, briefId: string): Promise<Brief> {
  console.log("Validating brief:", briefId);
  
  try {
    const { data: brief, error: briefError } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefError || !brief) {
      console.error("Brief validation failed:", briefError || "Brief not found");
      throw new Error(briefError?.message || "Brief not found");
    }

    console.log("Brief validation successful:", {
      briefId: brief.id,
      title: brief.title,
      currentStage: brief.current_stage
    });

    return brief;
  } catch (error) {
    console.error("Brief validation error:", error);
    throw error;
  }
}