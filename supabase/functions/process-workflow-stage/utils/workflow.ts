import { generateAgentResponse } from './openai.ts';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) {
  console.log('Processing agent:', {
    agentId: agent.id,
    agentName: agent.name,
    briefId: brief.id,
    stageId,
    requirements,
    previousOutputsCount: previousOutputs.length
  });

  // Build context from previous outputs
  const previousContext = previousOutputs
    .map(output => `Previous stage output: ${output.content}`)
    .join('\n\n');

  // Construct the prompt with brief details and requirements
  const prompt = `
As ${agent.name}, you are working on the following brief:

Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
Target Audience: ${brief.target_audience}
Budget: ${brief.budget}
Timeline: ${brief.timeline}

${previousContext ? `\nContext from previous stages:\n${previousContext}` : ''}

${requirements ? `\nSpecific requirements for this step:\n${requirements}` : ''}

Please provide your professional analysis and recommendations based on the brief details and requirements above.
`;

  try {
    const response = await generateAgentResponse(prompt);
    
    console.log('Agent response received:', {
      agentId: agent.id,
      responseLength: response.length,
      timestamp: new Date().toISOString()
    });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        skills: agent.skills
      },
      outputs: [{
        content: response,
        timestamp: new Date().toISOString()
      }]
    };
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw error;
  }
}