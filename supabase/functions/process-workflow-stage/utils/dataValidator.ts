import { createClient } from '@supabase/supabase-js';

export async function validateWorkflowData(supabase: any, briefId: string, stageId: string) {
  console.log('🔍 Validating workflow data:', {
    briefId,
    stageId,
    timestamp: new Date().toISOString()
  });

  // Validate brief exists
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', briefId)
    .single();

  if (briefError || !brief) {
    throw new Error(`Brief validation failed: ${briefError?.message || 'Not found'}`);
  }

  // Validate stage and get flow steps
  const { data: stage, error: stageError } = await supabase
    .from('stages')
    .select(`
      *,
      flows (
        id,
        name,
        flow_steps (
          id,
          agent_id,
          requirements,
          agents (
            id,
            name,
            description,
            temperature,
            skills (*)
          )
        )
      )
    `)
    .eq('id', stageId)
    .single();

  if (stageError || !stage) {
    throw new Error(`Stage validation failed: ${stageError?.message || 'Not found'}`);
  }

  console.log('✅ Workflow data validated:', {
    briefId,
    stageId,
    flowStepsCount: stage.flows?.flow_steps?.length,
    timestamp: new Date().toISOString()
  });

  return { brief, stage };
}