import { buildBasePrompt } from './prompts/basePrompt.ts';
import { buildFeedbackSection } from './prompts/feedbackSection.ts';
import { buildInstructionsSection } from './prompts/instructionsSection.ts';

export const buildPrompt = async (
  agent: any,
  brief: any,
  previousOutputs: any[] = [],
  requirements: string = "",
  isFirstStage: boolean = true,
  isReprocessing: boolean = false,
  feedback: string = ""
) => {
  console.log('🔄 Building prompt with:', {
    agentName: agent.name,
    briefTitle: brief.title,
    isReprocessing,
    hasFeedback: !!feedback,
    feedbackPreview: feedback ? `${feedback.substring(0, 100)}...` : 'none'
  });

  // System prompt - focus on agent role and capabilities
  const systemPrompt = `You are ${agent.name}, a specialized creative agency professional.
Your role and expertise:
${agent.skills?.map(skill => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Important: Do not repeat the project overview information in your response. Focus on your specific contribution and insights.
Base your analysis on the project context provided in the user message.`;

  // User prompt - contains project context and specific instructions
  const userPrompt = `Project Context:
- Title: ${brief.title || ''}
- Brand: ${brief.brand || 'Not specified'}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
- Target Audience: ${brief.target_audience || ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}
${brief.website ? `- Website: ${brief.website}` : ''}

Stage Requirements:
${requirements || 'No specific requirements provided'}

${previousOutputs.length > 0 ? `Team Context:
${previousOutputs.map(output => `${output.agent}'s key points: ${output.content}`).join('\n')}` : ''}

Focus your response on:
1. Your specific expertise and unique contribution
2. New insights and recommendations not already covered
3. Concrete action items and next steps
4. Integration with previous team members' contributions
5. Specific metrics and success criteria

Do not repeat the project overview - focus on your analysis and recommendations.`;

  // Add feedback section if present
  const feedbackSection = buildFeedbackSection(feedback, isReprocessing);

  const finalPrompt = `
${systemPrompt}

${feedbackSection}

${userPrompt}

Respond in a clear, structured format.
`;

  return {
    conversationalPrompt: finalPrompt,
    systemPrompt: `You are ${agent.name}, a specialized agent with expertise in ${agent.description || 'your field'}. ${
      isReprocessing ? 'You are reprocessing a previous response based on feedback.' : ''
    }`
  };
};