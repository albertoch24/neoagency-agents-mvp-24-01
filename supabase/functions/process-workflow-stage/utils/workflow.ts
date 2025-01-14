import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';
import { processFeedback } from './feedbackProcessor.ts';
import { validateFeedbackIncorporation } from './validators.ts';
import { parseFeedback, validateFeedbackPoints } from './feedbackParser.ts';

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
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    // Process feedback if present
    const feedbackContext = feedbackId ? await processFeedback(
      supabase,
      brief.id,
      stageId,
      agent.id,
      feedbackId
    ) : null;

    // Parse feedback into structured points if available
    let feedbackPoints = [];
    if (feedbackContext?.feedbackContent) {
      feedbackPoints = parseFeedback(feedbackContext.feedbackContent);
      
      if (!validateFeedbackPoints(feedbackPoints)) {
        console.error('❌ Invalid feedback structure detected');
        throw new Error('Invalid feedback structure');
      }
      
      console.log('✅ Feedback parsed successfully:', {
        pointsCount: feedbackPoints.length,
        points: feedbackPoints,
        timestamp: new Date().toISOString()
      });
    }

    // Get original output if reprocessing
    let originalOutput = null;
    if (feedbackContext?.isReprocessing) {
      const { data: originalConversation } = await supabase
        .from('workflow_conversations')
        .select('content')
        .eq('id', feedbackContext.originalConversationId)
        .single();
      
      originalOutput = originalConversation?.content;
      console.log('Retrieved original output:', {
        hasOutput: !!originalOutput,
        timestamp: new Date().toISOString()
      });
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

    console.log('Built prompts:', {
      systemPromptLength: systemPrompt.length,
      conversationalPromptLength: conversationalPrompt.length,
      timestamp: new Date().toISOString()
    });

    // Generate new response with retries
    let retryCount = 0;
    const maxRetries = 3;
    let response = null;

    while (retryCount < maxRetries) {
      try {
        response = await generateAgentResponse(conversationalPrompt, systemPrompt);
        if (response?.conversationalResponse) {
          break;
        }
        retryCount++;
        console.log(`Retry attempt ${retryCount} for agent response`);
      } catch (retryError) {
        console.error(`Error on retry ${retryCount}:`, retryError);
        if (retryCount === maxRetries - 1) throw retryError;
        retryCount++;
      }
    }

    if (!response || !response.conversationalResponse) {
      console.error('❌ No response generated from agent:', {
        agentId: agent.id,
        agentName: agent.name,
        retryCount,
        timestamp: new Date().toISOString()
      });
      throw new Error('No response generated from agent after retries');
    }

    console.log('✅ Generated response:', {
      responseLength: response.conversationalResponse.length,
      timestamp: new Date().toISOString()
    });

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

      console.log('✅ Feedback incorporation validated successfully');
    }

    const result = {
      agent: agent.name,
      requirements,
      outputs: [{
        content: response.conversationalResponse,
        type: 'conversational'
      }],
      stepId: agent.id,
      orderIndex: 0
    };

    console.log('✅ Successfully processed agent:', {
      agentName: agent.name,
      outputLength: result.outputs[0].content.length,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('❌ Error in processAgent:', {
      error,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}