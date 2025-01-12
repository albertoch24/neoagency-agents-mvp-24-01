import { formatFeedback } from "./prompt/feedbackFormatter.ts";
import { buildBriefDetails, buildPreviousOutputsSection, buildAgentSkillsSection } from "./prompt/sectionsBuilder.ts";
import { buildOutputRequirements, formatRequirements } from "./prompt/requirementsBuilder.ts";

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[] = [],
  requirements?: string,
  isFirstStage: boolean = false
) => {
  console.log("Building prompt for:", {
    agentName: agent.name,
    briefTitle: brief.title,
    requirementsCount: previousOutputs?.length,
    isFirstStage
  });

  const { baseRequirements, feedbackSection } = formatFeedback(requirements);
  const outputRequirements = buildOutputRequirements(agent);

  console.log("Building output requirements section:", {
    requirementsCount: outputRequirements.length,
    requirements: outputRequirements
  });

  const sections = [
    buildBriefDetails(brief),
    !isFirstStage ? buildPreviousOutputsSection(previousOutputs, isFirstStage) : '',
    buildAgentSkillsSection(agent),
    formatRequirements(outputRequirements),
    baseRequirements,
    feedbackSection ? `\nFEEDBACK INCORPORATION:\n${feedbackSection}` : ''
  ].filter(Boolean).join('\n\n');

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to analyze this creative brief in two complementary ways:

    1. CONVERSATIONAL ANALYSIS:
    Share your thoughts naturally, including:
    - Your initial impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    ${feedbackSection ? '- How you are addressing each aspect of the provided feedback' : ''}
    ${!isFirstStage ? '- References to previous discussions or outputs where relevant' : ''}

    2. STRUCTURED OUTPUT:
    Then, provide your specific recommendations and insights in a structured format:
    ${outputRequirements.map((req: string, index: number) => 
      `${index + 1}. ${req}`
    ).join('\n    ')}

    IMPORTANT GUIDELINES:
    - Be specific and actionable in your recommendations
    - Keep your tone professional but conversational
    - Connect your structured outputs to your analysis
    ${feedbackSection ? '- Demonstrate how you\'ve incorporated all feedback elements' : ''}

    Here is the context for your analysis:
    ${sections}
  `;

  console.log("Generated prompt:", {
    promptLength: conversationalPrompt.length,
    preview: conversationalPrompt.substring(0, 100),
    sectionsIncluded: {
      hasBriefDetails: true,
      hasPreviousOutputs: !isFirstStage,
      hasAgentSkills: true,
      hasOutputRequirements: true,
      hasFormattedRequirements: true
    }
  });

  return {
    conversationalPrompt
  };
};