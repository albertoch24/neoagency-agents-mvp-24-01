import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function fetchBriefDetails(supabase: any, briefId: string) {
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', briefId)
    .single();

  if (briefError) throw briefError;
  return brief;
}

export async function fetchStageDetails(supabase: any, stageId: string) {
  const { data: stage, error: stageError } = await supabase
    .from('stages')
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
    .eq('id', stageId)
    .single();

  if (stageError) throw stageError;
  return stage;
}

export async function saveConversation(supabase: any, briefId: string, stageId: string, agentId: string, content: string) {
  const { error: conversationError } = await supabase
    .from('workflow_conversations')
    .insert({
      brief_id: briefId,
      stage_id: stageId,
      agent_id: agentId,
      content: content
    });

  if (conversationError) throw conversationError;
}

export async function saveBriefOutput(supabase: any, briefId: string, stageId: string, stageName: string, outputs: any[]) {
  const { error: outputError } = await supabase
    .from('brief_outputs')
    .insert({
      brief_id: briefId,
      stage: stageId,
      stage_id: stageId,
      content: {
        stage_name: stageName,
        outputs: outputs
      }
    });

  if (outputError) throw outputError;
}