import { createClient } from '@supabase/supabase-js';

export async function getBriefData(supabase: any, briefId: string) {
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', briefId)
    .maybeSingle();

  if (briefError || !brief) {
    throw new Error(`Error fetching brief: ${briefError?.message || 'Brief not found'}`);
  }

  return brief;
}

export async function getPreviousOutput(supabase: any, briefId: string, currentStageId: string) {
  console.log('🔍 Fetching previous output:', {
    briefId,
    currentStageId,
    timestamp: new Date().toISOString()
  });

  // First, get the current stage details to find its order_index
  const { data: currentStage, error: currentStageError } = await supabase
    .from('stages')
    .select('order_index, user_id')
    .eq('id', currentStageId)
    .maybeSingle();

  if (currentStageError) {
    console.error('❌ Error fetching current stage:', {
      error: currentStageError,
      currentStageId,
      timestamp: new Date().toISOString()
    });
    throw currentStageError;
  }

  if (!currentStage) {
    console.error('❌ Current stage not found:', {
      currentStageId,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  // Then, find the previous stage based on order_index
  const { data: previousStage, error: previousStageError } = await supabase
    .from('stages')
    .select('id, name')
    .eq('user_id', currentStage.user_id)
    .lt('order_index', currentStage.order_index)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousStageError) {
    console.error('❌ Error fetching previous stage:', {
      error: previousStageError,
      currentStageId,
      orderIndex: currentStage.order_index,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  if (!previousStage) {
    console.log('ℹ️ No previous stage found (this might be the first stage):', {
      currentStageId,
      orderIndex: currentStage.order_index,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  // Finally, get the output for the previous stage
  const { data: previousOutput, error: previousOutputError } = await supabase
    .from('brief_outputs')
    .select(`
      *,
      stages!inner (
        id,
        name
      )
    `)
    .eq('brief_id', briefId)
    .eq('stage_id', previousStage.id)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (previousOutputError) {
    console.error('❌ Error fetching previous output:', {
      error: previousOutputError,
      briefId,
      previousStageId: previousStage.id,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  console.log('📊 Previous output status:', {
    exists: !!previousOutput,
    currentStageId,
    previousStageId: previousStage.id,
    outputId: previousOutput?.id,
    createdAt: previousOutput?.created_at,
    timestamp: new Date().toISOString()
  });

  return previousOutput;
}