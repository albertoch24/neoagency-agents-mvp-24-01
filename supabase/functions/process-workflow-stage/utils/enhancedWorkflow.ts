import { AgentFactory } from "./agents/AgentFactory.ts";

export async function processStageWithEnhancedAgents(
  supabase: any,
  brief: any,
  currentStage: any,
  flowSteps: any[],
  feedbackId?: string | null
) {
  const processId = crypto.randomUUID();
  
  console.log("🚀 Starting enhanced workflow:", {
    processId,
    briefId: brief.id,
    stageId: currentStage.id,
    stepsCount: flowSteps.length,
    hasFeedback: !!feedbackId,
    timestamp: new Date().toISOString()
  });

  console.log("🤖 Initializing specialized agents...", { processId });
  const briefAnalyzer = AgentFactory.createBriefAnalyzer();
  const creativeDirector = AgentFactory.createCreativeDirector();
  const contentSpecialist = AgentFactory.createContentSpecialist();

  console.log("✅ Agents initialized:", {
    processId,
    agents: [
      briefAnalyzer.role,
      creativeDirector.role,
      contentSpecialist.role
    ],
    timestamp: new Date().toISOString()
  });

  try {
    // 1. Brief Analysis
    console.log("📋 Starting brief analysis...", { processId });
    const briefAnalysis = await briefAnalyzer.process({
      brief,
      stage: currentStage,
      requirements: flowSteps.map(step => step.requirements)
    }, null, feedbackId);
    
    console.log("✅ Brief analysis completed:", {
      processId,
      analysisLength: briefAnalysis.length,
      timestamp: new Date().toISOString()
    });

    // 2. Creative Strategy
    console.log("🎨 Developing creative strategy...", { processId });
    const creativeStrategy = await creativeDirector.process({
      briefAnalysis,
      stage: currentStage,
      previousOutputs: []
    }, briefAnalysis, feedbackId);
    
    console.log("✅ Creative strategy developed:", {
      processId,
      strategyLength: creativeStrategy.length,
      timestamp: new Date().toISOString()
    });

    // 3. Content Creation
    console.log("✍️ Starting content creation...", { processId });
    const outputs = await Promise.all(
      flowSteps.map(async (step, index) => {
        console.log(`🔄 Processing step ${index + 1}/${flowSteps.length}`, {
          processId,
          stepId: step.id,
          agentName: step.agents?.name
        });
        
        const content = await contentSpecialist.process({
          step,
          briefAnalysis,
          creativeStrategy,
          orderIndex: index
        }, {
          briefAnalysis,
          creativeStrategy
        }, feedbackId);

        console.log(`✅ Step ${index + 1} completed`, {
          processId,
          contentLength: content.length,
          timestamp: new Date().toISOString()
        });

        return {
          agent: step.agents?.name || "Unknown Agent",
          requirements: step.requirements,
          outputs: [{
            content,
            type: 'conversational'
          }],
          stepId: step.id,
          orderIndex: index,
          processedAt: new Date().toISOString()
        };
      })
    );

    console.log("📊 Processing summary:", {
      processId,
      totalSteps: flowSteps.length,
      outputsGenerated: outputs.length,
      timestamp: new Date().toISOString()
    });

    return outputs;

  } catch (error) {
    console.error("❌ Error in enhanced workflow:", {
      processId,
      error,
      briefId: brief.id,
      stageId: currentStage.id,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}