import { supabase } from "@/integrations/supabase/client";
import { logQuery } from "./queryLogger";

export const fetchBrief = async (briefId: string) => {
  const { data: brief, error } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', briefId)
    .maybeSingle();

  if (error) {
    logQuery.error('Error fetching brief', { error, briefId });
    throw error;
  }

  if (!brief) {
    logQuery.error('Brief not found', { briefId });
    throw new Error('Brief not found');
  }

  return brief;
};

export const fetchOutputs = async (briefId: string, stageId: string) => {
  const { data: outputs, error } = await supabase
    .from('brief_outputs')
    .select('*, stage:stages(name)')
    .eq('brief_id', briefId)
    .eq('stage_id', stageId);

  if (error) {
    logQuery.error('Error fetching outputs', { error, briefId, stageId });
    throw error;
  }

  logQuery.info('Outputs fetched', {
    briefId,
    stageId,
    outputsCount: outputs?.length || 0,
    outputIds: outputs?.map(o => o.id)
  });

  return outputs;
};

export const fetchConversations = async (briefId: string, stageId: string) => {
  const { data: conversations, error } = await supabase
    .from('workflow_conversations')
    .select(`
      *,
      agents (
        id,
        name
      ),
      flow_steps (
        id,
        order_index,
        description
      )
    `)
    .eq('brief_id', briefId)
    .eq('stage_id', stageId);

  if (error) {
    logQuery.error('Error fetching conversations', { error, briefId, stageId });
    throw error;
  }

  logQuery.info('Conversations fetched', {
    briefId,
    stageId,
    conversationsCount: conversations?.length || 0
  });

  return conversations;
};