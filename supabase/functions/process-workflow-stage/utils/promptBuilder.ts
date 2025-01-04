export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean
) => {
  // Format previous outputs if not first stage
  const previousStageOutputs = !isFirstStage
    ? previousOutputs
        ?.map((output: any) => `
          Stage: ${output.stage}
          Content: ${typeof output.content === 'object' ? JSON.stringify(output.content, null, 2) : output.content}
        `)
        .join('\n\n')
    : '';

  // Format requirements
  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  // Construct conversational prompt
  const conversationalPrompt = `
    As ${agent.name}, analyze this creative brief ${!isFirstStage ? 'and previous stage outputs ' : ''}in a natural, conversational way:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${formattedRequirements}
    
    ${!isFirstStage ? `Previous Stage Outputs:
    ${previousStageOutputs}` : ''}
    
    Your Role and Background:
    ${agent.description}
    
    Your Skills:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Share your thoughts as if you're speaking in a creative agency meeting. Be natural, use conversational language, 
    express your professional opinion, and make it feel like a real conversation.
    
    Remember to:
    1. ${isFirstStage ? 'Start fresh with this new brief' : 'Reference and build upon insights from previous stages'}
    2. Use first-person pronouns ("I think...", "In my experience...")
    3. Include verbal fillers and transitions natural to spoken language
    4. Express enthusiasm and emotion where appropriate
    5. Reference team dynamics and collaborative aspects
    6. Use industry jargon naturally but explain complex concepts
    7. Share personal insights and experiences
    8. Ask rhetorical questions to engage others
    9. Use informal but professional language
    ${formattedRequirements}
  `;

  // Construct schematic prompt
  const schematicPrompt = `
    As ${agent.name}, analyze this creative brief${!isFirstStage ? ' and previous stage outputs' : ''}:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${formattedRequirements}
    
    ${!isFirstStage ? `Previous Stage Outputs:
    ${previousStageOutputs}` : ''}
    
    Your Role:
    ${agent.description}
    
    Skills Applied:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Provide a clear, structured analysis following these guidelines:
    ${isFirstStage ? `
    1. Initial Project Assessment
    2. Strategic Direction
    3. Action Items
    4. Potential Challenges
    5. Success Metrics
    ` : `
    1. Key Insights from Previous Stages
    2. Strategic Recommendations
    3. Action Items
    4. Potential Challenges
    5. Success Metrics
    `}
    
    Format your response with clear headings and bullet points.
    Focus on concrete, actionable items and measurable outcomes.
    Keep the tone professional and direct.
    ${formattedRequirements}
  `;

  return { conversationalPrompt, schematicPrompt };
};