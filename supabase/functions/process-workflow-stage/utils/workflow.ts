export async function processAgent(
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = [],
  feedbackId: string | null = null
) {
  try {
    if (!agent || !agent.id) {
      console.error('Invalid agent configuration:', agent);
      throw new Error('Invalid agent configuration');
    }

    console.log('🚀 Starting agent processing:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      hasFeedback: !!feedbackId
    });

    // Build comprehensive system prompt using agent skills
    const systemPrompt = `You are ${agent.name}, a specialized creative agency professional with the following skills:
${agent.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description}
  ${skill.content}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title}
- Description: ${brief.description}
- Objectives: ${brief.objectives}
${brief.target_audience ? `- Target Audience: ${brief.target_audience}` : ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}

Requirements for this stage:
${requirements || 'No specific requirements provided.'}

${previousOutputs.length > 0 ? `
Consider previous outputs from team members:
${previousOutputs.map(output => `
${output.agent}: ${output.content}
`).join('\n')}
` : ''}

Provide a detailed, actionable response that:
1. Analyzes the brief through your professional lens
2. Offers specific recommendations based on your skills
3. Addresses the stage requirements directly
4. Proposes next steps and action items
`;

    // Build user prompt
    const userPrompt = `Please analyze this brief and provide your professional insights and recommendations.
Focus on your areas of expertise and provide actionable, specific guidance.`;

    console.log('📝 Generated prompts:', {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    });

    // Simulate response for now (replace with actual OpenAI call)
    const response = {
      conversationalResponse: `As ${agent.name}, here are my recommendations...`
    };

    if (!response || !response.conversationalResponse) {
      throw new Error('No response generated from agent');
    }

    console.log('✅ Successfully generated response:', {
      responseLength: response.conversationalResponse.length
    });

    return {
      agent: agent.name,
      requirements,
      outputs: [{
        content: response.conversationalResponse,
        type: 'conversational'
      }],
      stepId: agent.id,
      orderIndex: 0
    };
  } catch (error) {
    console.error('❌ Error in processAgent:', error);
    throw error;
  }
}