import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export async function validateWorkflowData(briefId: string, stageId: string) {
  console.log('Validating workflow data:', { briefId, stageId });
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Validate brief exists
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .maybeSingle();
      
    if (briefError || !brief) {
      console.error('Brief validation failed:', briefError);
      throw new Error(`Brief not found: ${briefError?.message || 'No brief found'}`);
    }
    
    // Validate stage exists with detailed logging
    console.log('Fetching stage data...');
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          flow_steps (
            id,
            agent_id,
            requirements,
            agents (
              id,
              name,
              description,
              temperature
            )
          )
        )
      `)
      .eq('id', stageId)
      .maybeSingle();
      
    if (stageError || !stage) {
      console.error('Stage validation failed:', stageError);
      throw new Error(`Stage not found: ${stageError?.message || 'No stage found'}`);
    }
    
    console.log('Stage data retrieved:', {
      stageId: stage.id,
      flowStepsCount: stage.flows?.flow_steps?.length || 0
    });
    
    if (!stage.flows?.flow_steps?.length) {
      throw new Error('No flow steps found for stage');
    }
    
    // Validate each flow step has required data
    stage.flows.flow_steps.forEach((step, index) => {
      if (!step.agent_id || !step.agents) {
        throw new Error(`Invalid flow step at index ${index}: missing agent data`);
      }
    });
    
    console.log('Workflow data validation completed successfully');
    return { brief, stage };
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}