export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean,
  flowStepOutputs?: { title: string; content: string }[]
) => {
  // Format requirements
  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  // Format flow step outputs if available
  const formattedFlowStepOutputs = flowStepOutputs && flowStepOutputs.length > 0
    ? `\nFlow Step Outputs:\n${flowStepOutputs.map(output => 
        `Title: ${output.title}\nContent: ${output.content}`
      ).join('\n\n')}`
    : '';

  // For first stage, we don't include any previous outputs
  const previousStageOutputs = !isFirstStage
    ? previousOutputs
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
        .join('\n\n')
    : '';

  // Construct conversational prompt
  const conversationalPrompt = `
    As ${agent.name}, ${isFirstStage ? 'analyze this creative brief' : 'analyze this creative brief, previous stage outputs, and any specific flow step outputs'} in a natural, conversational way:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${formattedRequirements}
    
    ${!isFirstStage ? `Previous Stage Outputs:
    ${previousStageOutputs}` : ''}

    ${flowStepOutputs ? formattedFlowStepOutputs : ''}
    
    Your Role and Background:
    ${agent.description}
    
    Your Skills:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Share your thoughts as if you're speaking in a creative agency meeting. Be natural, use conversational language, 
    express your professional opinion, and make it feel like a real conversation.
    
    Remember to:
    1. ${isFirstStage 
      ? 'Start fresh with this new brief, focusing solely on the provided brief information' 
      : 'Reference and build upon insights from previous stages and flow step outputs'}
    2. Use first-person pronouns ("I think...", "In my experience...")
    3. Include verbal fillers and transitions natural to spoken language
    4. Express enthusiasm and emotion where appropriate
    5. Reference team dynamics and collaborative aspects
    6. Use industry jargon naturally but explain complex concepts
    7. Share personal insights and experiences
    8. Ask rhetorical questions to engage others
    9. Use informal but professional language
    10. Consider and reference any specific flow step outputs in your analysis
    ${formattedRequirements}
  `;

  // Get outputs from flow step if available
  const stepOutputs = agent.flow_steps?.[0]?.outputs || [];
  const outputRequirements = stepOutputs.map((output: any) => output.text).filter(Boolean);

  // Construct schematic prompt with dynamic output requirements
  const schematicPrompt = `
    As ${agent.name}, ${isFirstStage ? 'analyze this creative brief' : 'analyze this creative brief, previous stage outputs, and any specific flow step outputs'}:
    
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
    Keep the tone professional and direct.
    Ensure each response directly addresses the specific output requirement.
    When referencing previous outputs or flow step outputs, clearly indicate how they influence your recommendations.
    ${formattedRequirements}
  `;

  return { conversationalPrompt, schematicPrompt };
};