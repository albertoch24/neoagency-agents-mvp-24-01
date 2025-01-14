import { generateAgentResponse } from './openai';
import { buildPrompt } from './promptBuilder';
import { processFeedback } from './feedbackProcessor';
import { validateFeedbackIncorporation } from './validators';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = [],
  feedbackId: string | null = null
) {
  try {
    console.log('🚀 Starting agent processing:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      hasFeedback: !!feedbackId
    });

    // Process feedback if present
    const feedbackContext = feedbackId ? await processFeedback(
      supabase,
      brief.id,
      stageId,
      agent.id,
      feedbackId
    ) : null;

    // Get original output if reprocessing
    let originalOutput = null;
    if (feedbackContext?.isReprocessing) {
      const { data: originalConversation } = await supabase
        .from('workflow_conversations')
        .select('content')
        .eq('id', feedbackContext.originalConversationId)
        .single();
      
      originalOutput = originalConversation?.content;
    }

    // Build prompt with feedback context
    const { conversationalPrompt, systemPrompt } = await buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      previousOutputs.length === 0,
      feedbackContext?.isReprocessing || false,
      feedbackContext?.feedbackContent || ''
    );

    // Generate new response
    const response = await generateAgentResponse(conversationalPrompt, systemPrompt);

    if (!response || !response.conversationalResponse) {
      throw new Error('No response generated from agent');
    }

    // If reprocessing, validate feedback incorporation
    if (feedbackContext?.isReprocessing && originalOutput) {
      const validationResult = await validateFeedbackIncorporation(
        originalOutput,
        response.conversationalResponse,
        feedbackContext.feedbackContent
      );

      if (!validationResult.isValid) {
        console.error('❌ Feedback not properly incorporated:', validationResult.reason);
        throw new Error('Generated response does not properly address feedback');
      }
    }

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
    console.error('❌ Error in processAgent:', error);
    throw error;
  }
}