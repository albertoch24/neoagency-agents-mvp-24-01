import { buildBasePrompt } from './prompts/basePrompt.ts';
import { buildFeedbackSection } from './prompts/feedbackSection.ts';
import { buildInstructionsSection } from './prompts/instructionsSection.ts';

export const buildPrompt = async (
  agent: any,
  brief: any,
  previousOutputs: any[] = [],
  requirements: string = "",
  isFirstStage: boolean = true,
  isReprocessing: boolean = false,
  feedback: string = ""
) => {
  console.log('🔄 Building prompt with:', {
    agentName: agent.name,
    briefTitle: brief.title,
    isReprocessing,
    hasFeedback: !!feedback,
    feedbackPreview: feedback ? `${feedback.substring(0, 100)}...` : 'none'
  });

  const basePrompt = buildBasePrompt(agent, brief, isFirstStage);
  const feedbackSection = buildFeedbackSection(feedback, isReprocessing);
  const instructionsSection = buildInstructionsSection(requirements, previousOutputs);

  const finalPrompt = `
${basePrompt}

${feedbackSection}

${instructionsSection}

Your response MUST:
${isReprocessing ? `
1. Explicitly address each point from the feedback
2. Explain how your new response incorporates the feedback
3. Highlight what specific changes you made based on the feedback
4. Be substantially different from the original response
` : '1. Follow all instructions carefully'}

Respond in a clear, structured format.
`;

  return {
    conversationalPrompt: finalPrompt,
    systemPrompt: `You are ${agent.name}, a specialized agent with expertise in ${agent.description || 'your field'}. ${
      isReprocessing ? 'You are reprocessing a previous response based on feedback.' : ''
    }`
  };
};