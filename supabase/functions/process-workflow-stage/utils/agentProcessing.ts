import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processAgent } from "./workflow.ts";
import { saveBriefOutput } from "./database.ts";

export async function processAgents(briefId: string, stageId: string, flowSteps: any[] = []) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Fetching brief and stage data');

    // Get brief data
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('Error fetching brief:', briefError);
      throw briefError;
    }
    if (!brief) {
      throw new Error('Brief not found');
    }

    // Get stage data with flow and steps
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
            order_index,
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

    if (stageError) {
      console.error('Error fetching stage:', stageError);
      throw stageError;
    }
    if (!stage) {
      throw new Error('Stage not found');
    }
    if (!stage.flows?.flow_steps?.length) {
      throw new Error('No flow steps found for stage');
    }

    console.log('Processing stage:', {
      stageName: stage.name,
      flowStepsCount: flowSteps.length
    });

    // Sort flow steps by order_index
    const sortedFlowSteps = flowSteps.sort((a, b) => a.order_index - b.order_index);

    // Process each agent in sequence
    const outputs = [];
    for (const step of sortedFlowSteps) {
      if (!step.agents) {
        console.warn('Missing agent data for step:', step);
        continue;
      }

      console.log('Processing step with agent:', {
        agentName: step.agents?.name,
        stepId: step.id
      });
      
      const result = await processAgent(
        supabase,
        step.agents,
        brief,
        stageId,
        step.requirements,
        outputs
      );

      outputs.push(result);
    }

    // Prepare the content object for saving
    const content = {
      stage_name: stage.name,
      flow_name: stage.flows.name,
      agent_count: sortedFlowSteps.length,
      outputs: outputs.map(output => ({
        agent: output.agent,
        requirements: output.requirements,
        outputs: output.outputs,
        stepId: output.stepId,
        orderIndex: output.orderIndex
      }))
    };

    console.log('Saving outputs to brief_outputs:', {
      briefId,
      stageId,
      stageName: stage.name,
      outputsCount: outputs.length
    });

    await saveBriefOutput(
      supabase,
      briefId,
      stageId,
      content,
      stage.name
    );

    return outputs;

  } catch (error) {
    console.error('Error in processAgents:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}