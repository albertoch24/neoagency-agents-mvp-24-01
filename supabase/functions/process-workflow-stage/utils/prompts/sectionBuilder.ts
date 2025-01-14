export const buildSections = async (
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

  const reprocessingContext = buildReprocessingContext(isReprocessing, feedback);

  const sections = [
    reprocessingContext,
    buildBriefDetails(brief),
    buildPreviousOutputsSection(previousOutputs, isFirstStage),
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(outputRequirements),
    formattedRequirements
  ].filter(Boolean).join('\n\n');

  return sections;
};

const buildReprocessingContext = (isReprocessing: boolean, feedback?: string) => {
  if (!isReprocessing || !feedback) return '';
  
  return `
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
    6. Explicitly reference how you're addressing the feedback
    7. Highlight what you're changing based on the feedback
  `;
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
  if (!Array.isArray(previousOutputs) || previousOutputs.length === 0 || isFirstStage) {
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
`;
};