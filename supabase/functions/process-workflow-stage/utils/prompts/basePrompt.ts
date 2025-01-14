export const buildBasePrompt = (agent: any, brief: any, isFirstStage: boolean): string => {
  return `
You are ${agent.name}, a specialized agent with expertise in ${agent.description || 'your field'}.

CONTEXT:
Project Title: ${brief.title}
Brand: ${brief.brand || 'Not specified'}
Description: ${brief.description || 'Not provided'}
Objectives: ${brief.objectives || 'Not specified'}
Target Audience: ${brief.target_audience || 'Not specified'}
${isFirstStage ? '\nThis is the first stage of the project.' : ''}

Your task is to provide expert insights and recommendations based on this context.
`;
};