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
      previousOutputsCount: previousOutputs.length,
      previousOutputsSample: previousOutputs.map(output => ({
        id: output.id,
        type: output.output_type,
        contentPreview: typeof output.content === 'string' 
          ? output.content.substring(0, 100) 
          : 'Complex content structure'
      }))
    });

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
      const response = await processAgentInteractions(executor, brief, requirements, previousOutputs);
      
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
      previousOutputsCount: previousOutputs.length
    });

    const { conversationalPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs,
      requirements,
      isFirstStage
    );

    console.log('Generated prompt:', {
      promptLength: conversationalPrompt.length,
      preview: conversationalPrompt.substring(0, 100),
      containsPreviousOutputs: conversationalPrompt.includes('Previous Stage Outputs'),
      containsRequirements: conversationalPrompt.includes(requirements || '')
    });

    const response = await generateAgentResponse(conversationalPrompt);

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
    throw error;
  }
}