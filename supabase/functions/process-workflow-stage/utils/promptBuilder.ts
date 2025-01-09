export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false
) => {
  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  const sections = [
    buildBriefDetails(brief),
    buildPreviousOutputsSection(previousOutputs, isFirstStage),
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(agent.flow_steps?.[0]?.outputs?.map((output: any) => output.text).filter(Boolean) || []),
    formattedRequirements
  ].filter(Boolean).join('\n\n');

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to analyze this creative brief in two complementary ways:

    1. CONVERSATIONAL ANALYSIS:
    First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
    - Your initial impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    - References to previous discussions or outputs where relevant

    2. STRUCTURED OUTPUT:
    Then, provide a clear, structured analysis addressing each required output:
    ${outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')}

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

    Here is the context for your analysis:
    ${sections}
  `;

  return { conversationalPrompt };
};

const buildSystemInstructions = () => `
  1. Provide specific, actionable responses directly addressing each required output.
  2. Base your answers on insights derived from the brief and outputs of previous steps or stages.
  3. Avoid discussing the process or future steps—focus solely on meeting the requirements outlined.
  4. Use first-person pronouns ("I think...", "In my experience...").
  5. Include verbal fillers and transitions natural to spoken language.
  6. Express enthusiasm and emotion where appropriate.
  7. Reference team dynamics and collaborative aspects when relevant.
  8. Use industry jargon naturally but explain complex concepts where necessary.
  9. Share personal insights and experiences where they enhance the response.
  10. Ensure that every response is practical and actionable, tying back to the goals of the brief and previous outputs.
`;

const buildBriefDetails = (brief: any) => `
Brief Details:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
`;

const buildPreviousOutputsSection = (previousOutputs: any[], isFirstStage: boolean) => {
  if (isFirstStage) return '';
  
  const outputs = previousOutputs
    ?.filter((output: any) => 
      output.content && 
      typeof output.content === 'object' && 
      output.output_type === 'structured'
    )
    ?.map((output: any) => {
      const content = typeof output.content === 'string' 
        ? output.content 
        : JSON.stringify(output.content, null, 2);
        
      return `
      Stage: ${output.stage}
      Content: ${content}
      `;
    })
    .join('\n\n');

  return outputs ? `\nPrevious Stage Outputs:\n${outputs}` : '';
};

const buildFlowStepOutputsSection = (flowStepOutputs?: { title: string; content: string }[]) => {
  if (!flowStepOutputs?.length) return '';
  
  return `\nFlow Step Outputs:\n${flowStepOutputs.map(output => 
    `Title: ${output.title}\nContent: ${output.content}`
  ).join('\n\n')}`;
};

const buildAgentSkillsSection = (agent: any) => `
Your Role and Background:
${agent.description}

Skills Applied:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
`;

const buildOutputRequirementsSection = (outputRequirements: string[]) => `
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