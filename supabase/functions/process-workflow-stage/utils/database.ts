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
  console.log('Saving conversation:', {
    briefId,
    stageId,
    agentId,
    flowStepId,
    contentLength: content.length
  });

  const { error: conversationError } = await supabase
    .from("workflow_conversations")
    .insert({
      brief_id: briefId,
      stage_id: stageId,
      agent_id: agentId,
      content: content,
      flow_step_id: flowStepId
    });

  if (conversationError) {
    console.error('Error saving conversation:', conversationError);
    throw conversationError;
  }

  console.log('Conversation saved successfully');
}

export async function saveStructuredOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  flowStepId: string,
  content: string
) {
  console.log('Saving structured output:', {
    briefId,
    stageId,
    flowStepId,
    contentLength: content.length
  });

  const { error: outputError } = await supabase
    .from("structured_outputs")
    .insert({
      brief_id: briefId,
      stage_id: stageId,
      flow_step_id: flowStepId,
      content: content
    });

  if (outputError) {
    console.error('Error saving structured output:', outputError);
    throw outputError;
  }

  console.log('Structured output saved successfully');
}

export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  stageName: string,
  outputs: any[]
) {
  console.log('Saving brief output:', {
    briefId,
    stageId,
    stageName,
    outputsCount: outputs.length
  });

  try {
    const { error: outputError } = await supabase
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content: {
          stage_name: stageName,
          outputs: outputs.map(output => ({
            agent: output.agent,
            requirements: output.requirements,
            outputs: output.outputs,
            stepId: output.stepId,
            orderIndex: output.orderIndex
          }))
        }
      });

    if (outputError) {
      console.error('Error saving brief output:', outputError);
      throw outputError;
    }

    console.log('Brief output saved successfully');
  } catch (error) {
    console.error('Error in saveBriefOutput:', error);
    throw error;
  }
}