import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';

export const processWorkflowStage = async (
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) => {
  try {
    console.log('Processing agent:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      requirements,
      previousOutputsCount: previousOutputs.length
    });

    const isFirstStage = previousOutputs.length === 0;
    const { conversationalPrompt, schematicPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage
    );

    // Generate both conversational and schematic responses with better error handling
    try {
      const [conversationalResponse, schematicResponse] = await Promise.all([
        generateAgentResponse(conversationalPrompt),
        generateAgentResponse(schematicPrompt)
      ]);

      console.log('Agent responses generated successfully:', {
        agentId: agent.id,
        conversationalLength: conversationalResponse?.length,
        schematicLength: schematicResponse?.length,
        isFirstStage,
        hasContext: previousOutputs.length > 0
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
    } catch (openAiError) {
      console.error('OpenAI API error:', openAiError);
      throw new Error(`OpenAI API error: ${openAiError.message}`);
    }
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw error;
  }
};