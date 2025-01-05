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

  // Construct both prompts
  const { conversationalPrompt, schematicPrompt } = buildPrompt(
    agent,
    brief,
    previousOutputs,
    requirements,
    previousOutputs.length === 0
  );

  try {
    // Generate both conversational and schematic responses
    const [conversationalResponse, schematicResponse] = await Promise.all([
      generateAgentResponse(conversationalPrompt),
      generateAgentResponse(schematicPrompt)
    ]);
    
    console.log('Agent responses received:', {
      agentId: agent.id,
      conversationalLength: conversationalResponse.length,
      schematicLength: schematicResponse.length,
      timestamp: new Date().toISOString()
    });

    // Insert both types of responses
    const timestamp = new Date().toISOString();
    
    // Return both responses
    return {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        skills: agent.skills
      },
      outputs: [
        {
          content: conversationalResponse,
          type: 'conversational',
          timestamp
        },
        {
          content: schematicResponse,
          type: 'structured',
          timestamp
        }
      ]
    };
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw error;
  }
}