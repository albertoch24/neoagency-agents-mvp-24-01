import { processAgent } from './workflow';
import { validateWorkflowData } from './validation';
import { getRelevantDocuments } from './ragUtils';

export async function processAgents(briefId: string, stageId: string) {
  try {
    console.log('Starting workflow processing for:', { briefId, stageId });

    // Validate workflow data
    const { brief, stage } = await validateWorkflowData(briefId, stageId);
    if (!stage.flows?.flow_steps?.length) {
      throw new Error('No flow steps found for stage');
    }

    const outputs = [];
    let previousOutputs = [];

    // Process each agent in sequence
    for (const step of stage.flows.flow_steps) {
      console.log('Processing step:', {
        stepId: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index
      });

      // Get relevant documents for this step
      const relevantDocs = await getRelevantDocuments(
        briefId,
        `${brief.title} ${brief.description} ${step.requirements || ''}`
      );

      // Process the agent with document context
      const output = await processAgent(
        supabase,
        step.agents,
        brief,
        stageId,
        step.requirements || '',
        previousOutputs,
        relevantDocs
      );

      outputs.push(output);
      previousOutputs.push(output);
    }

    return {
      outputs,
      stage: stage.name,
      flow_name: stage.flows.name
    };
  } catch (error) {
    console.error('Error in processAgents:', error);
    throw error;
  }
}