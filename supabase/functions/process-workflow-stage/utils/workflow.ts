import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';
import { createAgentChain, processAgentInteractions } from './langchainAgents.ts';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) {
  try {
    console.log('Processing agent:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      requirements,
      previousOutputsCount: previousOutputs.length
    });

    // Get all agents involved in this stage
    const { data: stageAgents } = await supabase
      .from('agents')
      .select('*')
      .eq('stage_id', stageId);

    // Create LangChain agent chain if multiple agents are involved
    if (stageAgents && stageAgents.length > 1) {
      const executor = await createAgentChain(stageAgents, brief);
      const response = await processAgentInteractions(executor, brief, requirements);
      
      console.log('Multi-agent response:', response);

      return {
        agent: agent.name,
        requirements,
        outputs: [{
          content: response.outputs[0].content,
          type: 'conversational'
        }],
        stepId: agent.id,
        orderIndex: 0
      };
    }

    // Single agent processing
    const isFirstStage = previousOutputs.length === 0;
    const { conversationalPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage
    );

    console.log('Generated prompt:', {
      conversationalPrompt: conversationalPrompt.substring(0, 100) + '...'
    });

    const response = await generateAgentResponse(conversationalPrompt);

    console.log('Agent response:', {
      responseLength: response.conversationalResponse?.length
    });

    return {
      agent: agent.name,
      requirements,
      outputs: [{
        content: response.conversationalResponse,
        type: 'conversational'
      }],
      stepId: agent.id,
      orderIndex: 0
    };
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw error;
  }
}