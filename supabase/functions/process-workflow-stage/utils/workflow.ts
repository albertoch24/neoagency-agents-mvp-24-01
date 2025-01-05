import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';

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
      requirements
    });

    const isFirstStage = previousOutputs.length === 0;
    const { conversationalPrompt, schematicPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage
    );

    // Generate both conversational and schematic responses
    const [conversationalResponse, schematicResponse] = await Promise.all([
      generateAgentResponse(conversationalPrompt),
      generateAgentResponse(schematicPrompt)
    ]);

    console.log('Agent responses generated successfully:', {
      agentId: agent.id,
      conversationalLength: conversationalResponse?.length,
      schematicLength: schematicResponse?.length
    });

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