import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';
import { createAgentChain, processAgentInteractions } from './langchainAgents.ts';
import { processFeedback } from './feedbackProcessor.ts';
import { saveConversation } from './conversationManager.ts';
import { saveBriefOutput } from './outputManager.ts';

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
      feedbackId: feedbackId || 'none'
    });

    if (!agent || !agent.id) {
      console.error('❌ Invalid agent data:', agent);
      return null;
    }

    // Process feedback if present
    const feedbackContext = feedbackId ? await processFeedback(
      supabase,
      brief.id,
      stageId,
      agent.id,
      feedbackId
    ) : null;

    console.log('📝 Feedback context:', {
      hasFeedback: !!feedbackContext,
      feedbackContent: feedbackContext?.feedbackContent ? 
        `${feedbackContext.feedbackContent.substring(0, 100)}...` : 
        'none',
      isReprocessing: feedbackContext?.isReprocessing || false,
      isPermanent: feedbackContext?.isPermanent || false
    });

    // Get stage agents
    const { data: stageAgents } = await supabase
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
      .eq('stage_id', stageId);

    // Create LangChain agent chain if multiple agents
    if (stageAgents && stageAgents.length > 1) {
      console.log('🔄 Creating multi-agent chain:', {
        stageId,
        agentCount: stageAgents.length,
        agents: stageAgents.map(a => a.name)
      });

      const executor = await createAgentChain(stageAgents, brief);
      const response = await processAgentInteractions(
        executor,
        brief,
        requirements,
        previousOutputs,
        feedbackContext
      );

      // Save conversation and output
      await saveConversation(
        supabase,
        brief.id,
        stageId,
        agent.id,
        response.outputs[0].content,
        feedbackContext
      );

      await saveBriefOutput(
        supabase,
        brief.id,
        stageId,
        response.outputs,
        feedbackContext
      );

      return {
        agent: agent.name,
        requirements,
        outputs: response.outputs,
        stepId: agent.id,
        orderIndex: 0
      };
    }

    // Single agent processing
    const isFirstStage = previousOutputs.length === 0;
    console.log('🔄 Building prompt for single agent:', {
      agentName: agent.name,
      isFirstStage,
      previousOutputsCount: previousOutputs.length,
      hasFeedback: !!feedbackContext,
      feedbackContent: feedbackContext?.feedbackContent ? 
        `${feedbackContext.feedbackContent.substring(0, 100)}...` : 
        'none'
    });

    const { conversationalPrompt } = await buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage,
      feedbackContext?.isReprocessing || false,
      feedbackContext?.feedbackContent || ''
    );

    const response = await generateAgentResponse(conversationalPrompt);
    
    if (!response || !response.conversationalResponse) {
      console.error('❌ No response generated from agent:', {
        agentId: agent.id,
        agentName: agent.name
      });
      return null;
    }

    // Save results
    await saveConversation(
      supabase,
      brief.id,
      stageId,
      agent.id,
      response.conversationalResponse,
      feedbackContext
    );

    await saveBriefOutput(
      supabase,
      brief.id,
      stageId,
      [{
        content: response.conversationalResponse,
        type: 'conversational'
      }],
      feedbackContext
    );

    return {
      agent: agent.name,
      requirements,
      outputs: [
        {
          content: response.conversationalResponse,
          type: 'conversational'
        }
      ],
      stepId: agent.id,
      orderIndex: 0
    };
  } catch (error) {
    console.error('❌ Error in processAgent:', error);
    return null;
  }
}