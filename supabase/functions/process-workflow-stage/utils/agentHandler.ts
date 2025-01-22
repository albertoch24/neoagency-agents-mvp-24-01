export async function getAgentData(supabase: any, agentId: string) {
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      description,
      temperature,
      skills (
        id,
        name,
        type,
        content,
        description
      )
    `)
    .eq('id', agentId)
    .maybeSingle();

  if (agentError || !agent) {
    throw new Error(`Failed to fetch agent data: ${agentError?.message}`);
  }

  return agent;
}

export function generateSystemPrompt(agent: any, brief: any, previousOutput: any, requirements: string) {
  return `You are ${agent.name}, a specialized creative agency professional with the following skills:
${agent.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title || ''}
- Brand: ${brief.brand || 'Not specified'}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
- Target Audience: ${brief.target_audience || ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}
${brief.website ? `- Website: ${brief.website}` : ''}

${previousOutput ? `Previous stage output:
${JSON.stringify(previousOutput.content, null, 2)}` : 'No previous stage output available.'}

Requirements for this stage:
${requirements || 'No specific requirements provided'}

${outputs.length > 0 ? `
Consider previous outputs from team members:
${outputs.map(output => `
${output.agent}: ${output.content}
`).join('\n')}
` : ''}

Provide a detailed, actionable response that:
1. Analyzes the brief through your professional lens
2. Offers specific recommendations based on your skills
3. Addresses the stage requirements directly
4. Proposes next steps and action items
5. Maintains consistency with previous team members' outputs
6. Includes specific examples and implementation details
7. Considers the project timeline and budget constraints
8. Provides measurable success metrics when applicable

Your response should be comprehensive, strategic, and immediately actionable.`;
}