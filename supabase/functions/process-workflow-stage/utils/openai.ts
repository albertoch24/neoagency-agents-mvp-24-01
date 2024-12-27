import OpenAI from "https://esm.sh/openai@4.28.0"

export function createOpenAIClient() {
  return new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
}

export function createPrompt(agent: any, formattedSkills: any[], brief: any, stageId: string) {
  return `You are ${agent.name}, ${agent.description || 'an AI agent'}.

Your expertise and skills include:
${formattedSkills.map((skill: any) => `
- ${skill.name} (${skill.type}):
  ${skill.description || 'No description provided'}
  Details: ${skill.content}
`).join('\n')}

You are working on the following brief:
Title: ${brief.title}
Description: ${brief.description || 'No description provided'}
Objectives: ${brief.objectives || 'No objectives provided'}
Target Audience: ${brief.target_audience || 'No target audience specified'}
Budget: ${brief.budget || 'No budget specified'}
Timeline: ${brief.timeline || 'No timeline specified'}

Current Stage: ${stageId}

Based on your specific role, skills, and expertise described above, provide your professional analysis and recommendations for this stage of the project.
Be specific about how your skills will be applied to meet the brief's objectives.
Respond in a conversational way, as if you're speaking in a team meeting.`;
}