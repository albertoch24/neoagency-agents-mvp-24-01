import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processAgent } from "./workflow.ts";
import { saveBriefOutput } from "./database.ts";

export async function processAgents(
  briefId: string, 
  stageId: string, 
  flowSteps: any[] = [], 
  feedbackContext: any = null
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Starting processAgents with:', { 
      briefId, 
      stageId, 
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackContext,
      feedbackId: feedbackContext?.feedbackId || null
    });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Invalid input parameters');
    }

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

    // Get stage data
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('*, flows!inner(id, name)')
      .eq('id', stageId)
      .single();

    if (stageError) {
      console.error('Error fetching stage:', stageError);
      throw stageError;
    }
    if (!stage) {
      throw new Error('Stage not found');
    }

    console.log('Processing stage:', {
      stageName: stage.name,
      flowStepsCount: flowSteps.length,
      hasFeedback: !!feedbackContext
    });

    // Sort flow steps by order_index
    const sortedFlowSteps = flowSteps.sort((a, b) => a.order_index - b.order_index);

    // Process each agent in sequence
    const outputs = [];
    let processedAgents = 0;
    let failedAgents = 0;

    for (const step of sortedFlowSteps) {
      try {
        console.log('Processing step:', {
          stepId: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index,
          requirements: step.requirements?.substring(0, 100) + '...'
        });

        if (!step.agent_id) {
          console.error('Missing agent_id in step:', step);
          failedAgents++;
          continue;
        }

        // Get complete agent data with skills
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select(`
            id,
            name,
            description,
            temperature,
            skills (
              id,
              name,
              type,
              content,
              description
            )
          `)
          .eq('id', step.agent_id)
          .single();

        if (agentError) {
          console.error('Error fetching agent data:', {
            error: agentError,
            stepId: step.id,
            agentId: step.agent_id
          });
          failedAgents++;
          continue;
        }

        if (!agent) {
          console.error('Agent not found:', {
            stepId: step.id,
            agentId: step.agent_id
          });
          failedAgents++;
          continue;
        }

        console.log('Successfully retrieved agent data:', {
          agentId: agent.id,
          agentName: agent.name,
          skillsCount: agent.skills?.length || 0,
          hasFeedback: !!feedbackContext
        });

        const result = await processAgent(
          supabase,
          agent,
          brief,
          stageId,
          step.requirements,
          outputs,
          feedbackContext
        );

        if (result) {
          // Validate result structure
          if (!result.agent || !result.outputs || !Array.isArray(result.outputs)) {
            console.error('Invalid result structure from agent:', {
              agentName: agent.name,
              result
            });
            failedAgents++;
            continue;
          }

          outputs.push(result);
          processedAgents++;
          console.log(`Successfully processed agent ${agent.name}, total outputs: ${outputs.length}`);
        } else {
          console.error(`No result from agent ${agent.name}`);
          failedAgents++;
        }
      } catch (stepError) {
        console.error('Error processing step:', {
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id
        });
        failedAgents++;
        continue;
      }
    }

    // Log processing summary
    console.log('Agent processing summary:', {
      totalAgents: sortedFlowSteps.length,
      processedAgents,
      failedAgents,
      outputsGenerated: outputs.length
    });

    // Only throw error if no outputs were generated AND all agents failed
    if (outputs.length === 0 && failedAgents === sortedFlowSteps.length) {
      console.error('Critical failure: No outputs generated and all agents failed');
      throw new Error('No outputs were generated from any agent');
    }

    // Prepare the content object for saving
    const content = {
      stage_name: stage.name,
      flow_name: stage.flows?.name,
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
      outputsCount: outputs.length,
      hasFeedback: !!feedbackContext
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