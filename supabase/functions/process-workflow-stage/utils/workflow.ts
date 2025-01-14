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

    // Get feedback if present
    let feedback = '';
    let isReprocessing = false;
    if (feedbackId) {
      console.log('🔍 Fetching feedback for processing:', { feedbackId });
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('stage_feedback')
        .select('content, rating')
        .eq('id', feedbackId)
        .maybeSingle();

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
          isReprocessing
        });
      } else {
        console.error('❌ No feedback data found for ID:', feedbackId);
      }
    }

    // Get all agents involved in this stage
    console.log('🔍 Fetching stage agents');
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
      
      console.log('✅ Multi-agent response received:', {
        responseLength: response.outputs[0].content.length,
        preview: response.outputs[0].content.substring(0, 100),
        hasFeedback: !!feedback,
        isReprocessing
      });

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

    console.log('✅ Generated prompt:', {
      promptLength: conversationalPrompt.length,
      preview: conversationalPrompt.substring(0, 100),
      containsPreviousOutputs: conversationalPrompt.includes('Previous Stage Outputs'),
      containsRequirements: conversationalPrompt.includes(requirements || ''),
      hasFeedback: !!feedback,
      isReprocessing,
      feedbackIncluded: conversationalPrompt.includes(feedback)
    });

    const response = await generateAgentResponse(conversationalPrompt);
    
    if (!response || !response.conversationalResponse) {
      console.error('❌ No response generated from agent:', {
        agentId: agent.id,
        agentName: agent.name
      });
      return null;
    }

    console.log('✅ Agent response received:', {
      responseLength: response.conversationalResponse?.length,
      preview: response.conversationalResponse?.substring(0, 100),
      containsReferences: response.conversationalResponse?.includes('previous') || 
                         response.conversationalResponse?.includes('earlier') ||
                         response.conversationalResponse?.includes('before'),
      hasFeedback: !!feedback,
      isReprocessing,
      feedbackAddressed: response.conversationalResponse?.includes('feedback')
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