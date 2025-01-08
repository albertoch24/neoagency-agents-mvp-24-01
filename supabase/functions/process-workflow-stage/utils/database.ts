import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

export async function fetchBriefDetails(supabase: any, briefId: string) {
  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", briefId)
    .single();

  if (briefError) throw briefError;
  return brief;
}

export async function fetchStageDetails(supabase: any, stageId: string) {
  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select(`
      *,
      flows (
        id,
        name,
        flow_steps (
          *,
          agents (
            id,
            name,
            description,
            skills (*)
          )
        )
      )
    `)
    .eq("id", stageId)
    .single();

  if (stageError) throw stageError;
  return stage;
}

export async function saveConversation(
  supabase: any,
  briefId: string,
  stageId: string,
  agentId: string,
  content: string,
  flowStepId?: string
) {
  try {
    const { error: conversationError } = await supabase
      .from("workflow_conversations")
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        agent_id: agentId,
        content: content,
        flow_step_id: flowStepId
      });

    if (conversationError) throw conversationError;
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

export async function saveStructuredOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  flowStepId: string,
  content: string
) {
  try {
    const { error: outputError } = await supabase
      .from("structured_outputs")
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        flow_step_id: flowStepId,
        content: content
      });

    if (outputError) throw outputError;
  } catch (error) {
    console.error('Error saving structured output:', error);
    throw error;
  }
}

export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  stageName: string,
  outputs: any[]
) {
  try {
    // Validate inputs
    if (!briefId || !stageId || !stageName) {
      throw new Error('Missing required parameters');
    }

    // Prepare the content object with minimal nesting
    const content = {
      stage_name: stageName,
      outputs: outputs.map(output => ({
        agent: output.agent || 'Unknown Agent',
        requirements: output.requirements || '',
        outputs: Array.isArray(output.outputs) ? output.outputs : [],
        stepId: output.stepId || '',
        orderIndex: output.orderIndex || 0
      }))
    };

    // Insert the data
    const { error: outputError } = await supabase
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content
      });

    if (outputError) {
      console.error('Error saving brief output:', outputError);
      throw outputError;
    }

  } catch (error) {
    console.error('Error in saveBriefOutput:', error);
    throw error;
  }
}