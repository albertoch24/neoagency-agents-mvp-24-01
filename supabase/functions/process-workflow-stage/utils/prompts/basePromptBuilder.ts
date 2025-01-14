import { enhancePromptWithContext } from "../contextEnhancer";
import { buildSections } from "./sectionBuilder";
import { buildInstructions } from "./instructionBuilder";

export const buildPrompt = async (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false,
  isReprocessing: boolean = false,
  feedback?: string
) => {
  console.log("BuildPrompt called with:", {
    agentName: agent.name,
    briefTitle: brief.title,
    previousOutputsCount: previousOutputs?.length,
    requirements: requirements?.substring(0, 100) + "...",
    isFirstStage,
    isReprocessing,
    hasFeedback: !!feedback,
    feedbackPreview: feedback ? feedback.substring(0, 100) + "..." : "none"
  });

  // Build sections
  const sections = await buildSections(
    agent,
    brief,
    previousOutputs,
    requirements,
    isFirstStage,
    isReprocessing,
    feedback
  );

  // Build instructions
  const instructions = buildInstructions(isReprocessing, feedback);

  // Combine into final prompt
  const basePrompt = `
    As ${agent.name}, I'd like you to ${isReprocessing ? 're-analyze' : 'analyze'} this creative brief with a ${isReprocessing ? 'fresh perspective' : 'thorough approach'}:

    ${instructions}

    Here is the context for your analysis:
    ${sections}
  `;

  // Enhance with RAG context
  const enhancedPrompt = await enhancePromptWithContext(basePrompt, brief.id);

  return { conversationalPrompt: enhancedPrompt };
};