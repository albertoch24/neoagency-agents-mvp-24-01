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
  const { data: previousOutput, error: previousOutputError } = await supabase
    .from('brief_outputs')
    .select('*')
    .eq('brief_id', briefId)
    .eq('stage_id', stageId)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (previousOutputError) {
    console.error('Error fetching previous output:', previousOutputError);
  }

  console.log('Previous output status:', {
    exists: !!previousOutput,
    stageId,
    timestamp: new Date().toISOString()
  });

  return previousOutput;
}