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

  // Get outputs from flow step if available
  const stepOutputs = agent.flow_steps?.[0]?.outputs || [];
  const outputRequirements = stepOutputs.map((output: any) => output.text).filter(Boolean);

  // Construct conversational prompt
  const conversationalPrompt = `
    As ${agent.name}, analyze this creative brief in a natural, conversational way:
    
    // ... same brief details and context as schematic prompt ...
    
    Share concrete, actionable responses to address these required outputs, focusing on delivering practical and useful recommendations:
    ${outputRequirements.map((req: string, index: number) => `
    ${index + 1}. ${req}`).join('\n')}
    
    Remember to:
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
    ${formattedRequirements}
  `;

  // Construct schematic prompt with dynamic output requirements
  const schematicPrompt = `
    As ${agent.name}, analyze this creative brief:
    
    // ... same brief details and context as conversational prompt ...
    
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

  return { conversationalPrompt, schematicPrompt };
};