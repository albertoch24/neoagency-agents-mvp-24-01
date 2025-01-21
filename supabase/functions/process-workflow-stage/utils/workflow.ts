import { generateAgentResponse } from './openai.ts';
import { buildPrompt } from './promptBuilder.ts';
import { processFeedback } from './feedbackProcessor.ts';
import { validateFeedbackIncorporation } from './validators.ts';
import { parseFeedback, validateFeedbackPoints } from './feedbackParser.ts';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = [],
  feedbackId: string | null = null
) {
  try {
    console.log('🚀 Starting agent processing:', {
      agentId: agent.id,
      agentName: agent.name,
      briefId: brief.id,
      stageId,
      hasFeedback: !!feedbackId
    });

    // Process feedback if present
    const feedbackContext = feedbackId ? await processFeedback(
      supabase,
      brief.id,
      stageId,
      agent.id,
      feedbackId
    ) : null;

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
- Target Audience: ${brief.target_audience}
- Budget: ${brief.budget}
- Timeline: ${brief.timeline}

Requirements for this stage:
${requirements}

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

    // Build user prompt with feedback context if available
    const userPrompt = feedbackContext ? `
Please revise your previous response considering this feedback:
${feedbackContext.feedbackContent}

Ensure your new response:
1. Directly addresses each feedback point
2. Maintains professional expertise
3. Provides more detailed and actionable insights
` : `
Please analyze this brief and provide your professional insights and recommendations.
Focus on your areas of expertise and provide actionable, specific guidance.
`;

    console.log('📝 Generated prompts:', {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      hasFeedback: !!feedbackContext
    });

    // Generate response using OpenAI
    const response = await generateAgentResponse(userPrompt, systemPrompt);

    if (!response || !response.conversationalResponse) {
      throw new Error('No response generated from agent');
    }

    // If reprocessing, validate feedback incorporation
    if (feedbackContext?.isReprocessing) {
      const validationResult = await validateFeedbackIncorporation(
        feedbackContext.originalResponse,
        response.conversationalResponse,
        feedbackContext.feedbackContent
      );

      if (!validationResult.isValid) {
        console.error('❌ Feedback not properly incorporated:', validationResult.reason);
        throw new Error('Generated response does not properly address feedback');
      }
    }

    console.log('✅ Successfully generated response:', {
      responseLength: response.conversationalResponse.length,
      isReprocessing: feedbackContext?.isReprocessing
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