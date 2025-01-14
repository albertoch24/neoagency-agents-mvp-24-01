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
    console.log('🚀 Processing agent:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      requirements,
      previousOutputsCount: previousOutputs.length,
      hasFeedback: !!feedbackId
    });

    if (!agent || !agent.id) {
      console.error('❌ Invalid agent data:', agent);
      return null;
    }

    // Process feedback if present
    const feedbackContext = await processFeedback(
      supabase,
      brief.id,
      stageId,
      agent.id,
      feedbackId
    );

    // Get all agents involved in this stage
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

    // Create LangChain agent chain if multiple agents are involved
    if (stageAgents && stageAgents.length > 1) {
      console.log('🔄 Creating multi-agent chain for stage:', {
        stageId,
        agentCount: stageAgents.length,
        agents: stageAgents.map(a => a.name)
      });

      const executor = await createAgentChain(stageAgents, brief);
      const response = await processAgentInteractions(
        executor,
        brief,
        requirements,
        previousOutputs
      );

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
      hasFeedback: !!feedbackContext
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