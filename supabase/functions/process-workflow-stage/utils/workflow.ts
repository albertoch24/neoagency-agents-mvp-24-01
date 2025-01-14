import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';
import { createAgentChain, processAgentInteractions } from './langchainAgents.ts';

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
      hasFeedback: !!feedbackId,
      feedbackId: feedbackId || 'none'
    });

    if (!agent || !agent.id) {
      console.error('❌ Invalid agent data:', agent);
      return null;
    }

    // Get feedback and original conversation data if present
    let feedback = '';
    let isReprocessing = false;
    let originalConversationId = null;
    let originalOutputId = null;

    if (feedbackId) {
      console.log('🔍 Processing feedback:', { feedbackId });
      
      // Get the original conversation to link to
      const { data: originalConv, error: convError } = await supabase
        .from('workflow_conversations')
        .select('id')
        .eq('brief_id', brief.id)
        .eq('stage_id', stageId)
        .eq('agent_id', agent.id)
        .is('feedback_id', null)
        .is('original_conversation_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (convError) {
        console.error('❌ Error fetching original conversation:', convError);
      } else if (originalConv) {
        originalConversationId = originalConv.id;
        console.log('✅ Found original conversation:', originalConversationId);
      }

      // Get the original output to link to
      const { data: originalOutput, error: outputError } = await supabase
        .from('brief_outputs')
        .select('id')
        .eq('brief_id', brief.id)
        .eq('stage_id', stageId)
        .is('feedback_id', null)
        .is('original_output_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (outputError) {
        console.error('❌ Error fetching original output:', outputError);
      } else if (originalOutput) {
        originalOutputId = originalOutput.id;
        console.log('✅ Found original output:', originalOutputId);
      }

      // Get the feedback content
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('stage_feedback')
        .select('content, rating, requires_revision, is_permanent')
        .eq('id', feedbackId)
        .single();

      if (feedbackError) {
        console.error('❌ Error fetching feedback:', feedbackError);
      }

      if (feedbackData) {
        feedback = `Previous feedback: ${feedbackData.content}
Rating: ${feedbackData.rating || 'Not rated'}/5
Please address this feedback specifically in your new response.`;
        isReprocessing = true;
        
        console.log('✅ Retrieved feedback for processing:', {
          hasFeedback: !!feedback,
          feedbackPreview: feedback.substring(0, 100),
          rating: feedbackData.rating,
          isReprocessing,
          isPermanent: feedbackData.is_permanent
        });

        // Update feedback status if permanent
        if (feedbackData.is_permanent) {
          const { error: updateError } = await supabase
            .from('stage_feedback')
            .update({ processed_for_rag: true })
            .eq('id', feedbackId);

          if (updateError) {
            console.error('❌ Error updating feedback status:', updateError);
          }
        }
      }
    }

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
        agents: stageAgents.map(a => a.name),
        isReprocessing,
        hasFeedback: !!feedback
      });

      const executor = await createAgentChain(stageAgents, brief);
      const response = await processAgentInteractions(
        executor, 
        brief, 
        requirements, 
        previousOutputs,
        isReprocessing,
        feedback
      );

      const now = new Date().toISOString();

      // Save the conversation with complete feedback information
      const { data: savedConversation, error: convError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: brief.id,
          stage_id: stageId,
          agent_id: agent.id,
          content: response.outputs[0].content,
          output_type: 'conversational',
          feedback_id: feedbackId,
          original_conversation_id: originalConversationId,
          reprocessing: isReprocessing,
          reprocessed_at: isReprocessing ? now : null
        })
        .select()
        .single();

      if (convError) {
        console.error('❌ Error saving conversation:', convError);
        throw convError;
      }

      // Save corresponding brief output with feedback information
      const { error: outputError } = await supabase
        .from('brief_outputs')
        .insert({
          brief_id: brief.id,
          stage_id: stageId,
          stage: stageId,
          content: {
            outputs: response.outputs,
            feedback_used: feedback || null
          },
          feedback_id: feedbackId,
          original_output_id: originalOutputId,
          is_reprocessed: isReprocessing,
          reprocessed_at: isReprocessing ? now : null
        });

      if (outputError) {
        console.error('❌ Error saving brief output:', outputError);
        throw outputError;
      }

      console.log('✅ Multi-agent response saved:', {
        conversationId: savedConversation.id,
        originalConversationId,
        originalOutputId,
        feedbackId,
        isReprocessing
      });

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
      hasFeedback: !!feedback,
      isReprocessing,
      feedbackPreview: feedback ? feedback.substring(0, 100) : 'none'
    });

    const { conversationalPrompt } = await buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage,
      isReprocessing,
      feedback
    );

    const response = await generateAgentResponse(conversationalPrompt);
    
    if (!response || !response.conversationalResponse) {
      console.error('❌ No response generated from agent:', {
        agentId: agent.id,
        agentName: agent.name
      });
      return null;
    }

    const now = new Date().toISOString();

    // Save the conversation with complete feedback information
    const { data: savedConversation, error: convError } = await supabase
      .from('workflow_conversations')
      .insert({
        brief_id: brief.id,
        stage_id: stageId,
        agent_id: agent.id,
        content: response.conversationalResponse,
        output_type: 'conversational',
        feedback_id: feedbackId,
        original_conversation_id: originalConversationId,
        reprocessing: isReprocessing,
        reprocessed_at: isReprocessing ? now : null
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ Error saving conversation:', convError);
      throw convError;
    }

    // Save corresponding brief output with feedback information
    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: brief.id,
        stage_id: stageId,
        stage: stageId,
        content: {
          outputs: [{
            content: response.conversationalResponse,
            type: 'conversational'
          }],
          feedback_used: feedback || null
        },
        feedback_id: feedbackId,
        original_output_id: originalOutputId,
        is_reprocessed: isReprocessing,
        reprocessed_at: isReprocessing ? now : null
      });

    if (outputError) {
      console.error('❌ Error saving brief output:', outputError);
      throw outputError;
    }

    console.log('✅ Agent response saved:', {
      conversationId: savedConversation.id,
      originalConversationId,
      originalOutputId,
      feedbackId,
      isReprocessing,
      responseLength: response.conversationalResponse?.length
    });

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