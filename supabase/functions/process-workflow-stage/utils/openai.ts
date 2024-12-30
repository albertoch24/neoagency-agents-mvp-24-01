import OpenAI from "https://esm.sh/openai@4.28.0"

export function createOpenAIClient() {
  return new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
}

export function createAgentPrompt(agent: any, skills: any[], brief: any, stageName: string) {
  const skillsDescription = skills.map(skill => 
    `${skill.name}: ${skill.content}`
  ).join('\n');

  return `You are ${agent.name}, an AI agent with the following description:
${agent.description}

Your specific skills and expertise include:
${skillsDescription}

You are working on a brief with these details:
Title: ${brief.title}
Description: ${brief.description || 'No description provided'}
Objectives: ${brief.objectives || 'No objectives provided'}
Target Audience: ${brief.target_audience || 'No target audience specified'}
Budget: ${brief.budget || 'No budget specified'}
Timeline: ${brief.timeline || 'No timeline specified'}

Current Stage: ${stageName}

Based on your specific role, skills, and expertise described above, provide your professional analysis and recommendations for this stage of the project.
Be specific about how your skills will be applied to meet the brief's objectives.
Respond in a conversational way, as if you're speaking in a team meeting.`;
}