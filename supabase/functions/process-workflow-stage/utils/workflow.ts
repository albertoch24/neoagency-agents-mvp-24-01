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

      return {
        outputs: [
          {
            content: response,
            type: 'conversational'
          },
          {
            content: response,
            type: 'structured'
          }
        ]
      };
    }

    // Fallback to original single-agent processing if only one agent
    const isFirstStage = previousOutputs.length === 0;
    const { conversationalPrompt, schematicPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage
    );

    const [conversationalResponse, schematicResponse] = await Promise.all([
      generateAgentResponse(conversationalPrompt),
      generateAgentResponse(schematicPrompt)
    ]);

    return {
      outputs: [
        {
          content: conversationalResponse,
          type: 'conversational'
        },
        {
          content: schematicResponse,
          type: 'structured'
        }
      ]
    };
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw error;
  }
}