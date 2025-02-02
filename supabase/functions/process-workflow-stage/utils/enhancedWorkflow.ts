import { AgentFactory } from "./agents/AgentFactory.ts";

export async function processStageWithEnhancedAgents(
  supabase: any,
  brief: any,
  currentStage: any,
  flowSteps: any[],
  feedbackId?: string | null
) {
  console.log("🚀 Starting enhanced workflow processing:", {
    briefId: brief.id,
    stageId: currentStage.id,
    stepsCount: flowSteps.length,
    hasFeedback: !!feedbackId,
    timestamp: new Date().toISOString()
  });

  // Initialize agents with detailed logging
  console.log("🤖 Initializing specialized agents...");
  const briefAnalyzer = AgentFactory.createBriefAnalyzer();
  const creativeDirector = AgentFactory.createCreativeDirector();
  const contentSpecialist = AgentFactory.createContentSpecialist();

  console.log("✅ Agents initialized:", {
    briefAnalyzer: briefAnalyzer.role,
    creativeDirector: creativeDirector.role,
    contentSpecialist: contentSpecialist.role,
    timestamp: new Date().toISOString()
  });

  try {
    // 1. Brief Analysis with context and feedback
    console.log("📋 Starting brief analysis...");
    const briefAnalysis = await briefAnalyzer.process({
      brief,
      stage: currentStage,
      requirements: flowSteps.map(step => step.requirements)
    }, null, feedbackId);
    console.log("✅ Brief analysis completed");

    // 2. Creative Strategy Development
    console.log("🎨 Developing creative strategy...");
    const creativeStrategy = await creativeDirector.process({
      briefAnalysis,
      stage: currentStage,
      previousOutputs: []
    }, briefAnalysis, feedbackId);
    console.log("✅ Creative strategy developed");

    // 3. Content Creation with Tools and Feedback Integration
    console.log("✍️ Starting content creation...");
    const outputs = await Promise.all(
      flowSteps.map(async (step, index) => {
        console.log(`🔄 Processing step ${index + 1}/${flowSteps.length}`);
        
        const content = await contentSpecialist.process({
          step,
          briefAnalysis,
          creativeStrategy,
          orderIndex: index
        }, {
          briefAnalysis,
          creativeStrategy
        }, feedbackId);

        return {
          agent: step.agents?.name || "Unknown Agent",
          requirements: step.requirements,
          outputs: [{
            content,
            type: 'conversational'
          }],
          orderIndex: index,
          processedAt: new Date().toISOString()
        };
      })
    );
    console.log("✅ Content creation completed");

    console.log("📊 Processing summary:", {
      totalSteps: flowSteps.length,
      outputsGenerated: outputs.length,
      timestamp: new Date().toISOString()
    });

    return outputs;

  } catch (error) {
    console.error("❌ Error in enhanced workflow processing:", {
      error,
      briefId: brief.id,
      stageId: currentStage.id,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}