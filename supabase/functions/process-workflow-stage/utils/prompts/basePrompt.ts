export const buildBasePrompt = (agent: any, brief: any, isFirstStage: boolean) => {
  return `
As ${agent.name}, analyze and provide professional recommendations for this brief:

BRIEF DETAILS:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
Target Audience: ${brief.target_audience}
Timeline: ${brief.timeline}
Budget: ${brief.budget}

REQUIREMENTS:
1. Provide a detailed professional analysis
2. Include specific, actionable recommendations
3. Consider the context and constraints
4. Explain the rationale behind each suggestion
5. Highlight potential challenges and solutions
6. Include concrete next steps and follow-up actions

Your response should be structured as follows:
1. Executive Summary
2. Detailed Analysis
3. Strategic Recommendations
4. Implementation Plan
5. Risk Assessment
6. Success Metrics
7. Next Steps

Remember to:
- Be specific and actionable in your recommendations
- Consider the brief's constraints and objectives
- Provide clear rationale for each suggestion
- Include measurable outcomes
- Link your insights to the brief's goals
`;
};