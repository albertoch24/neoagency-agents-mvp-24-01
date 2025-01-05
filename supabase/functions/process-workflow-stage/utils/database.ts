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
}

export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  stageName: string,
  outputs: any[]
) {
  const { error: outputError } = await supabase
    .from("brief_outputs")
    .insert({
      brief_id: briefId,
      stage: stageId,
      stage_id: stageId,
      content: {
        stage_name: stageName,
        outputs: outputs.map(output => ({
          agent: output.agent.name,
          requirements: output.requirements,
          outputs: output.outputs,
          stepId: output.stepId,
          orderIndex: output.orderIndex
        }))
      },
    });

  if (outputError) throw outputError;
}

export async function saveOutputs(
  supabase: any,
  briefId: string,
  stageId: string,
  stageName: string,
  agentId: string,
  outputs: any[],
  flowStepId: string
) {
  console.log('Saving outputs:', {
    briefId,
    stageId,
    stageName,
    agentId,
    outputsCount: outputs.length,
    flowStepId
  });

  try {
    // Save conversational output to workflow_conversations
    const conversationalOutput = outputs.find(o => o.type === 'conversational');
    if (conversationalOutput) {
      const { error: conversationError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agentId,
          content: conversationalOutput.content,
          flow_step_id: flowStepId,
          output_type: 'conversational'
        });

      if (conversationError) throw conversationError;
    }

    // Save structured output to brief_outputs
    const structuredOutput = outputs.find(o => o.type === 'structured');
    if (structuredOutput) {
      const { error: outputError } = await supabase
        .from('brief_outputs')
        .insert({
          brief_id: briefId,
          stage: stageId,
          stage_id: stageId,
          content: {
            stage_name: stageName,
            agent: agentId,
            stepId: flowStepId,
            output: structuredOutput.content
          },
          output_type: 'structured'
        });

      if (outputError) throw outputError;
    }
  } catch (error) {
    console.error('Error saving outputs:', error);
    throw error;
  }
}
