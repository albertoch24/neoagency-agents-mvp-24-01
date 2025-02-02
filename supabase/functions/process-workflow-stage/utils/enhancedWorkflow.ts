import { AgentFactory } from "./agents/AgentFactory.ts";

export async function processStageWithEnhancedAgents(
  supabase: any,
  brief: any,
  currentStage: any,
  flowSteps: any[]
) {
  console.log("🚀 Starting enhanced workflow processing:", {
    briefId: brief.id,
    stageId: currentStage.id,
    stepsCount: flowSteps.length,
    timestamp: new Date().toISOString()
  });

  // Initialize agents
  const briefAnalyzer = AgentFactory.createBriefAnalyzer();
  const creativeDirector = AgentFactory.createCreativeDirector();
  const contentSpecialist = AgentFactory.createContentSpecialist();

  try {
    // 1. Brief Analysis with context
    const briefAnalysis = await briefAnalyzer.process({
      brief,
      stage: currentStage,
      requirements: flowSteps.map(step => step.requirements)
    });
    console.log("📋 Brief analysis completed");

    // 2. Creative Strategy Development
    const creativeStrategy = await creativeDirector.process({
      briefAnalysis,
      stage: currentStage,
      previousOutputs: [] // Add previous outputs if needed
    });
    console.log("🎨 Creative strategy developed");

    // 3. Content Creation with Tools
    const outputs = await Promise.all(
      flowSteps.map(async (step, index) => {
        const content = await contentSpecialist.process({
          step,
          briefAnalysis,
          creativeStrategy,
          orderIndex: index
        });

        return {
          agent: step.agents?.name || "Unknown Agent",
          requirements: step.requirements,
          outputs: [{
            content,
            type: 'conversational'
          }],
          orderIndex: index
        };
      })
    );
    console.log("✍️ Content creation completed");

    return outputs;

  } catch (error) {
    console.error("❌ Error in enhanced workflow processing:", error);
    throw error;
  }
}