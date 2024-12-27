import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function clearPreviousData(supabaseClient: any, briefId: string, stageId: string) {
  console.log('Clearing previous outputs and conversations for brief:', briefId, 'stage:', stageId);
  
  const { error: deleteError } = await supabaseClient
    .from('brief_outputs')
    .delete()
    .eq('brief_id', briefId)
    .eq('stage', stageId);

  if (deleteError) {
    console.error('Error clearing previous outputs:', deleteError);
  }

  const { error: deleteConvError } = await supabaseClient
    .from('workflow_conversations')
    .delete()
    .eq('brief_id', briefId)
    .eq('stage_id', stageId);

  if (deleteConvError) {
    console.error('Error clearing previous conversations:', deleteConvError);
  }
}

export async function createDefaultResponse(supabaseClient: any, briefId: string, stageId: string) {
  await supabaseClient
    .from('brief_outputs')
    .insert({
      brief_id: briefId,
      stage: stageId,
      content: {
        agent_id: 'system',
        agent_name: 'System',
        response: 'No active agents are currently available to process this stage. Please try again later or contact support.'
      }
    });
}

export async function storeAgentResponse(
  supabaseClient: any,
  agent: any,
  response: string,
  briefId: string,
  stageId: string,
  formattedSkills: any[]
) {
  await supabaseClient
    .from('workflow_conversations')
    .insert({
      brief_id: briefId,
      stage_id: stageId,
      agent_id: agent.id,
      content: response
    });

  await supabaseClient
    .from('brief_outputs')
    .insert({
      brief_id: briefId,
      stage: stageId,
      content: {
        agent_id: agent.id,
        agent_name: agent.name,
        agent_description: agent.description,
        agent_skills: formattedSkills,
        response: response
      }
    });

  console.log('Stored response for agent:', agent.name);
}