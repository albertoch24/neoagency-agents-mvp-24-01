import { formatFeedback } from './prompt/feedbackFormatter';
import { buildOutputRequirements, formatRequirements } from './prompt/requirementsBuilder';
import { 
  buildBriefDetails, 
  buildPreviousOutputsSection, 
  buildAgentSkillsSection 
} from './prompt/sectionsBuilder';

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false
) => {
  console.log("BuildPrompt called with:", {
    agentName: agent.name,
    briefTitle: brief.title,
    previousOutputsCount: previousOutputs?.length,
    requirements: requirements?.substring(0, 100) + "...",
    isFirstStage,
    hasFeedback: requirements?.includes("Previous feedback received:")
  });

  // Process feedback if present
  const { baseRequirements, feedbackSection } = formatFeedback(requirements);
  
  // Build output requirements
  const outputRequirements = buildOutputRequirements(agent);

  // Build all sections
  const sections = [
    buildBriefDetails(brief),
    !isFirstStage ? buildPreviousOutputsSection(previousOutputs, isFirstStage) : '',
    buildAgentSkillsSection(agent),
    formatRequirements(outputRequirements),
    baseRequirements,
    feedbackSection
  ].filter(Boolean).join('\n\n');

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to analyze this creative brief${feedbackSection ? ' with special attention to the provided feedback' : ''}:

    1. CONVERSATIONAL ANALYSIS:
    First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
    - Your initial impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    ${feedbackSection ? '- How you are addressing the specific feedback provided' : ''}
    ${!isFirstStage ? '- References to previous discussions or outputs where relevant' : ''}

    2. STRUCTURED OUTPUT:
    Then, provide a clear, structured analysis addressing each required output:
    ${outputRequirements.length > 0 
      ? outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')
      : '- Provide your expert analysis and recommendations'}

    Format your response with:
    ### Conversational Response
    [Your natural, dialogue-style analysis]

    ### Structured Outputs
    [Your point-by-point structured responses]

    Remember to:
    - Maintain your unique voice and personality throughout
    ${!isFirstStage ? '- Reference specific parts of the brief and previous outputs' : '- Focus on setting the right foundation for the project'}
    - Ensure each structured output is concrete and actionable
    - Keep the conversational part engaging and insightful
    - Connect your structured outputs to your conversational analysis
    ${feedbackSection ? '- Explicitly address how you\'ve incorporated the feedback' : ''}

    Here is the context for your analysis:
    ${sections}
  `;

  console.log('Generated prompt:', {
    agentName: agent.name,
    briefTitle: brief.title,
    requirementsCount: outputRequirements.length,
    previousOutputsCount: previousOutputs.length,
    promptLength: conversationalPrompt.length,
    sectionsIncluded: {
      hasBriefDetails: !!buildBriefDetails(brief),
      hasPreviousOutputs: !isFirstStage && !!buildPreviousOutputsSection(previousOutputs, isFirstStage),
      hasAgentSkills: !!buildAgentSkillsSection(agent),
      hasOutputRequirements: !!outputRequirements.length,
      hasFormattedRequirements: !!baseRequirements,
      hasFeedbackSection: !!feedbackSection
    }
  });

  return { conversationalPrompt };
};