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

export async function getPreviousOutput(supabase: any, briefId: string, stageId: string) {
  console.log('🔍 Fetching previous output:', {
    briefId,
    stageId,
    timestamp: new Date().toISOString()
  });

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
    .eq('stage_id', stageId)  // Usa stage_id invece di stage
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (previousOutputError) {
    console.error('❌ Error fetching previous output:', {
      error: previousOutputError,
      briefId,
      stageId,
      timestamp: new Date().toISOString()
    });
  }

  console.log('📊 Previous output status:', {
    exists: !!previousOutput,
    stageId,
    outputId: previousOutput?.id,
    createdAt: previousOutput?.created_at,
    timestamp: new Date().toISOString()
  });

  return previousOutput;
}