import { enhancePromptWithContext } from "./contextEnhancer.ts";

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

  // Build base prompt
  const basePrompt = await buildBasePrompt(
    agent,
    brief,
    previousOutputs,
    requirements,
    isFirstStage,
    isReprocessing,
    feedback
  );

  // Enhance prompt with RAG context
  const enhancedPrompt = await enhancePromptWithContext(basePrompt, brief.id);

  return { conversationalPrompt: enhancedPrompt };
};

const buildBasePrompt = async (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false,
  isReprocessing: boolean = false,
  feedback?: string
) => {
  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  const outputRequirements = agent.flow_steps?.[0]?.outputs
    ?.map((output: any) => output.text)
    .filter(Boolean) || [];

  const reprocessingContext = isReprocessing && feedback ? `
    IMPORTANT - This is a reprocessing request based on the following feedback:
    ${feedback}
    
    Please address this feedback specifically in your new response and provide a different perspective or approach.
    Ensure your new response is substantially different from the previous one while still meeting the original requirements.
    
    Key instructions for reprocessing:
    1. Carefully consider the feedback provided above
    2. Address each point mentioned in the feedback
    3. Provide new insights or approaches
    4. Ensure your response is significantly different from before
    5. Maintain alignment with original requirements
  ` : '';

  console.log("Building prompt sections with:", {
    hasReprocessingContext: !!reprocessingContext,
    feedbackLength: feedback?.length || 0,
    requirementsLength: formattedRequirements.length,
    outputRequirementsCount: outputRequirements.length
  });

  const sections = [
    reprocessingContext,
    buildBriefDetails(brief),
    buildPreviousOutputsSection(previousOutputs, isFirstStage),
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(outputRequirements),
    formattedRequirements
  ].filter(Boolean).join('\n\n');

  const basePrompt = `
    As ${agent.name}, I'd like you to ${isReprocessing ? 're-analyze' : 'analyze'} this creative brief with a ${isReprocessing ? 'fresh perspective' : 'thorough approach'}:

    1. CONVERSATIONAL ANALYSIS:
    First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
    - Your ${isReprocessing ? 'new' : 'initial'} impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    - References to previous discussions or outputs where relevant
    ${isReprocessing ? '- Address the specific feedback provided and explain your new approach' : ''}

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
    - Reference specific parts of the brief and previous outputs
    - Ensure each structured output is concrete and actionable
    - Keep the conversational part engaging and insightful
    - Connect your structured outputs to your conversational analysis
    ${isReprocessing ? '- Provide substantially different insights and approaches from your previous response' : ''}

    Here is the context for your analysis:
    ${sections}
  `;

  console.log("Final prompt structure:", {
    promptLength: basePrompt.length,
    hasReprocessingInstructions: basePrompt.includes('IMPORTANT - This is a reprocessing request'),
    hasFeedbackContent: basePrompt.includes(feedback || '')
  });

  return basePrompt;
};

const buildBriefDetails = (brief: any) => {
  return `
Brief Details:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
`;
};

const buildPreviousOutputsSection = (previousOutputs: any[], isFirstStage: boolean) => {
  if (!Array.isArray(previousOutputs) || previousOutputs.length === 0) {
    return '';
  }

  if (isFirstStage) {
    return '';
  }
  
  const outputs = previousOutputs
    .filter((output: any) => {
      const hasValidContent = output?.content && 
        (typeof output.content === 'string' || typeof output.content === 'object');
      return hasValidContent;
    })
    .map((output: any) => {
      let content = output.content;
      if (typeof content === 'object') {
        try {
          content = JSON.stringify(content, null, 2);
        } catch (e) {
          return null;
        }
      }
      
      return `
      Stage: ${output.stage || 'Unknown Stage'}
      Content: ${content}
      `;
    })
    .filter(Boolean)
    .join('\n\n');

  return outputs ? `\nPrevious Stage Outputs:\n${outputs}` : '';
};

const buildAgentSkillsSection = (agent: any) => {
  return `
Your Role and Background:
${agent.description}

Skills Applied:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
`;
};

const buildOutputRequirementsSection = (outputRequirements: string[]) => {
  return `
Please provide a structured analysis that specifically addresses each of these required outputs:
${outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')}

Format your response with clear headings and bullet points for each required output.
Ensure each response is:
1. Concrete and actionable, directly addressing the specific output requirements.
2. Based on insights from the brief and outputs of previous steps or stages, with clear references to how they influence your recommendations.
3. Structured, using concise bullet points or subheadings to organize information logically.
4. Thorough and exhaustive, covering all relevant aspects to provide a complete response.
5. Professional and direct in tone, avoiding unnecessary elaboration or discussion of the process or future steps.
6. Focused solely on the outputs, ensuring practical and useful recommendations for each point.

When referencing previous outputs or flow step outputs:
- Explicitly indicate their relevance and how they inform your recommendations.
- Tie your answers back to the brief's goals to ensure alignment.
`;
};