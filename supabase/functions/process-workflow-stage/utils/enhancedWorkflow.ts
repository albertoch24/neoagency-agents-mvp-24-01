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

  // Inizializza gli agenti
  const briefAnalyzer = AgentFactory.createBriefAnalyzer();
  const creativeDirector = AgentFactory.createCreativeDirector();
  const contentSpecialist = AgentFactory.createContentSpecialist();

  try {
    // 1. Analisi del brief
    const briefAnalysis = await briefAnalyzer.process({
      brief,
      stage: currentStage,
      requirements: flowSteps.map(step => step.requirements)
    });
    console.log("📋 Brief analysis completed");

    // 2. Sviluppo strategia creativa
    const creativeStrategy = await creativeDirector.process({
      briefAnalysis,
      stage: currentStage
    });
    console.log("🎨 Creative strategy developed");

    // 3. Creazione contenuto
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
            text: content
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