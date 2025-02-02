import { SpecializedAgent, AGENT_CONFIGS } from "./SpecializedAgents.ts";

export async function processStageWithEnhancedAgents(
  supabase: any,
  brief: any,
  stage: any,
  flowSteps: any[]
) {
  console.log("🚀 Starting enhanced stage processing:", {
    briefId: brief.id,
    stageId: stage.id,
    flowStepsCount: flowSteps.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Inizializza gli agenti specializzati
    const briefAnalyzer = new SpecializedAgent(AGENT_CONFIGS.briefAnalyzer);
    const creativeDirector = new SpecializedAgent(AGENT_CONFIGS.creativeDirector);
    const contentSpecialist = new SpecializedAgent(AGENT_CONFIGS.contentSpecialist);

    // Sort flow steps by order
    const sortedSteps = [...flowSteps].sort((a, b) => 
      (a.order_index || 0) - (b.order_index || 0)
    );

    // Process each step with specialized agents
    const results = [];
    for (const step of sortedSteps) {
      console.log("📝 Processing step:", {
        stepId: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index
      });

      // 1. Brief Analyzer analizza i requisiti
      const briefAnalysis = await briefAnalyzer.process({
        brief,
        step,
        requirements: step.requirements
      });

      // 2. Creative Director sviluppa la strategia
      const creativeStrategy = await creativeDirector.process({
        briefAnalysis,
        step,
        previousResults: results
      });

      // 3. Content Specialist crea il contenuto
      const content = await contentSpecialist.process({
        briefAnalysis,
        creativeStrategy,
        step,
        requirements: step.requirements
      });

      results.push({
        agent: step.agents?.name || 'Unknown Agent',
        stepId: step.agent_id,
        outputs: [{
          content: content,
          type: 'conversational'
        }],
        analysis: briefAnalysis,
        strategy: creativeStrategy,
        orderIndex: step.order_index || 0
      });

      console.log("✅ Step completed:", {
        stepId: step.id,
        outputsGenerated: results.length
      });
    }

    // Clear memories after processing
    await Promise.all([
      briefAnalyzer.clearMemory(),
      creativeDirector.clearMemory(),
      contentSpecialist.clearMemory()
    ]);

    console.log("✨ Enhanced processing completed:", {
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });

    return results;
  } catch (error) {
    console.error("❌ Error in enhanced processing:", error);
    throw error;
  }
}