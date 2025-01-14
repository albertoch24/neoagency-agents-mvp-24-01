export const buildBasePrompt = (agent: any, brief: any, isFirstStage: boolean) => {
  return `
As ${agent.name}, your task is to analyze and respond to the following brief:

BRIEF DETAILS:
Title: ${brief.title}
${brief.description ? `Description: ${brief.description}` : ''}
${brief.objectives ? `Objectives: ${brief.objectives}` : ''}
${brief.target_audience ? `Target Audience: ${brief.target_audience}` : ''}
${brief.brand ? `Brand: ${brief.brand}` : ''}
${brief.budget ? `Budget: ${brief.budget}` : ''}
${brief.timeline ? `Timeline: ${brief.timeline}` : ''}

${isFirstStage ? 'This is the initial analysis stage.' : 'This stage builds upon previous analysis.'}
`;
};