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
  isReprocessing: boolean = false
) {
  try {
    console.log('Processing agent:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      requirements,
      previousOutputsCount: previousOutputs.length,
      isReprocessing,
      previousOutputsSample: previousOutputs.map(output => ({
        id: output.id,
        type: output.output_type,
        contentPreview: typeof output.content === 'string' 
          ? output.content.substring(0, 100) 
          : 'Complex content structure'
      }))
    });

    if (!agent || !agent.id) {
      console.error('Invalid agent data:', agent);
      return null;
    }

    // Get feedback if reprocessing
    let feedback = '';
    if (isReprocessing) {
      const { data: feedbackData } = await supabase
        .from('stage_feedback')
        .select('content')
        .eq('stage_id', stageId)
        .eq('brief_id', brief.id)
        .order('created_at', { ascending: false })
        .limit(1);

      feedback = feedbackData?.[0]?.content || '';
      console.log('Retrieved feedback for reprocessing:', {
        hasFeedback: !!feedback,
        feedbackPreview: feedback.substring(0, 100)
      });
    }

    // Get all agents involved in this stage
    const { data: stageAgents } = await supabase
      .from('agents')
      .select('*')
      .eq('stage_id', stageId);

    // Create LangChain agent chain if multiple agents are involved
    if (stageAgents && stageAgents.length > 1) {
      console.log('Creating multi-agent chain for stage:', {
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
        isReprocessing,
        feedback
      );
      
      console.log('Multi-agent response received:', {
        responseLength: response.outputs[0].content.length,
        preview: response.outputs[0].content.substring(0, 100)
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
    console.log('Building prompt for single agent:', {
      agentName: agent.name,
      isFirstStage,
      previousOutputsCount: previousOutputs.length,
      isReprocessing
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

    console.log('Generated prompt:', {
      promptLength: conversationalPrompt.length,
      preview: conversationalPrompt.substring(0, 100),
      containsPreviousOutputs: conversationalPrompt.includes('Previous Stage Outputs'),
      containsRequirements: conversationalPrompt.includes(requirements || ''),
      isReprocessing,
      hasFeedback: !!feedback
    });

    const response = await generateAgentResponse(conversationalPrompt);
    
    if (!response || !response.conversationalResponse) {
      console.error('No response generated from agent:', {
        agentId: agent.id,
        agentName: agent.name
      });
      return null;
    }

    console.log('Agent response received:', {
      responseLength: response.conversationalResponse?.length,
      preview: response.conversationalResponse?.substring(0, 100),
      containsReferences: response.conversationalResponse?.includes('previous') || 
                         response.conversationalResponse?.includes('earlier') ||
                         response.conversationalResponse?.includes('before')
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
    console.error('Error in processAgent:', error);
    // Instead of throwing, return null to allow other agents to continue
    return null;
  }
}