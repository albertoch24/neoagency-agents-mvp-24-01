import { formatRequirements, formatPreviousOutputs, formatFlowStepOutputs } from './formatters.ts';

const getOutputRequirements = (agent: any) => {
  const defaultRequirements = [
    "Strategic Analysis",
    "Key Recommendations",
    "Implementation Steps",
    "Success Metrics"
  ];
  
  return agent.output_requirements?.length > 0 
    ? agent.output_requirements 
    : defaultRequirements;
};

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[] = [],
  requirements: string = "",
  isFirstStage: boolean = false
) => {
  const formattedRequirements = formatRequirements(requirements);
  const previousStageOutputs = formatPreviousOutputs(previousOutputs);
  const flowStepOutputs = previousOutputs.length > 0 ? formatFlowStepOutputs(previousOutputs) : '';
  const outputRequirements = getOutputRequirements(agent);

  const conversationalPrompt = `
    As ${agent.name}, you're participating in a creative team meeting to discuss this brief:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    
    ${!isFirstStage ? `Context from previous discussions:
    ${previousStageOutputs}` : ''}

    Your expertise:
    ${agent.description}
    
    Your relevant skills:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Share your thoughts and insights on:
    ${outputRequirements.map((req: string) => `- ${req}`).join('\n')}
    
    ${formattedRequirements}
    
    Remember to:
    1. Speak naturally as if in a meeting
    2. Reference and build upon previous discussions
    3. Share specific examples and experiences
    4. Be collaborative and open to feedback
    5. Focus on practical, actionable insights
  `;

  const schematicPrompt = `
    As ${agent.name}, analyze this creative brief:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${formattedRequirements}
    
    ${!isFirstStage ? `Previous Stage Outputs:
    ${previousStageOutputs}` : ''}

    ${flowStepOutputs ? formattedFlowStepOutputs : ''}
    
    Your Role:
    ${agent.description}
    
    Skills Applied:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Please provide a structured analysis that specifically addresses each of these required outputs:
    ${outputRequirements.map((req: string, index: number) => `
    ${index + 1}. ${req}`).join('\n')}
    
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

    ${formattedRequirements}
  `;

  return {
    conversationalPrompt,
    schematicPrompt
  };
};