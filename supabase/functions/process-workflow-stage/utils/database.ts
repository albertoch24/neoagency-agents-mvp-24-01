import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../types/database';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const saveBriefOutput = async (
  briefId: string,
  stage: string,
  content: any,
  stageId?: string
) => {
  console.log('Saving brief output:', {
    briefId,
    stage,
    stageId,
    contentSample: JSON.stringify(content).substring(0, 100)
  });

  try {
    const { data, error } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stage,
        content: content,
        stage_id: stageId
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving brief output:', error);
      throw error;
    }

    console.log('Successfully saved brief output:', {
      id: data.id,
      briefId: data.brief_id,
      stage: data.stage,
      contentSample: JSON.stringify(data.content).substring(0, 100)
    });

    return data;
  } catch (error) {
    console.error('Error in saveBriefOutput:', error);
    throw error;
  }
};

export const saveWorkflowConversation = async (
  briefId: string,
  stageId: string,
  agentId: string,
  content: string,
  outputType: string = 'conversational',
  summary?: string,
  flowStepId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('workflow_conversations')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        agent_id: agentId,
        content,
        output_type: outputType,
        summary,
        flow_step_id: flowStepId
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving workflow conversation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveWorkflowConversation:', error);
    throw error;
  }
};

export const getWorkflowConversations = async (briefId: string, stageId: string) => {
  try {
    const { data, error } = await supabase
      .from('workflow_conversations')
      .select(`
        *,
        agents (
          id,
          name,
          description,
          skills (*)
        )
      `)
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching workflow conversations:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getWorkflowConversations:', error);
    throw error;
  }
};

export const getBriefOutputs = async (briefId: string, stageId: string) => {
  try {
    const { data, error } = await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .eq('stage', stageId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brief outputs:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBriefOutputs:', error);
    throw error;
  }
};