import { CollaborativeAgentNetwork } from "../../../src/utils/langchain/CollaborativeAgentNetwork";

export async function processStageWithEnhancedAgents(
  supabase: any,
  brief: any,
  stage: any,
  flowSteps: any[]
) {
  console.log("Starting enhanced stage processing:", {
    briefId: brief.id,
    stageId: stage.id,
    flowStepsCount: flowSteps.length,
    timestamp: new Date().toISOString()
  });

  try {
    const network = new CollaborativeAgentNetwork();
    
    // Sort flow steps by order
    const sortedSteps = [...flowSteps].sort((a, b) => 
      (a.order_index || 0) - (b.order_index || 0)
    );

    // Process each step collaboratively
    const results = [];
    for (const step of sortedSteps) {
      // Get collaborator IDs (next and previous agents if they exist)
      const currentIndex = sortedSteps.indexOf(step);
      const collaborators = sortedSteps
        .filter((_, index) => 
          Math.abs(index - currentIndex) === 1
        )
        .map(s => s.agent_id);

      const result = await network.processWithCollaboration(
        {
          brief,
          stage,
          step,
          previousResults: results
        },
        step.agent_id,
        collaborators
      );

      results.push({
        agent: step.agents?.name || 'Unknown Agent',
        stepId: step.agent_id,
        outputs: [{
          content: result.primaryResult.result,
          type: 'conversational'
        }],
        collaborativeInsights: result.collaborativeInsights,
        orderIndex: step.order_index || 0
      });
    }

    console.log("Enhanced processing completed:", {
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });

    return results;
  } catch (error) {
    console.error("Error in enhanced processing:", error);
    throw error;
  }
}