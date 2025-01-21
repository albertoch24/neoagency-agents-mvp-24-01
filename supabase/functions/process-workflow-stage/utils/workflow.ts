import { createClient } from '@supabase/supabase-js';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) {
  if (!agent?.id) {
    console.error("Invalid agent data:", { agent });
    throw new Error("Agent data is missing or invalid");
  }

  if (!brief?.id) {
    console.error("Invalid brief data:", { brief });
    throw new Error("Brief data is missing or invalid");
  }

  console.log("Starting agent processing:", {
    agentId: agent.id,
    briefId: brief.id,
    stageId,
    hasRequirements: !!requirements,
    previousOutputsCount: previousOutputs.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Get complete agent data
    const { data: agentData, error: agentError } = await supabase
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
          content
        )
      `)
      .eq('id', agent.id)
      .single();

    if (agentError || !agentData) {
      console.error("Error fetching agent data:", { error: agentError, agentId: agent.id });
      throw new Error(`Failed to fetch agent data: ${agentError?.message || 'Agent not found'}`);
    }

    console.log("Retrieved agent data:", {
      agentId: agentData.id,
      agentName: agentData.name,
      skillsCount: agentData.skills?.length || 0
    });

    // Build system prompt using agent skills
    const systemPrompt = `You are ${agentData.name}, a specialized creative agency professional with the following skills:
${agentData.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title || ''}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
${brief.target_audience ? `- Target Audience: ${brief.target_audience}` : ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}

Requirements for this stage:
${requirements || 'No specific requirements provided.'}

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
4. Proposes next steps and action items`;

    // For now, return a simulated response (replace with actual OpenAI call)
    const response = {
      conversationalResponse: `As ${agentData.name}, here are my recommendations based on the brief...`,
      structuredOutput: {
        analysis: {
          key_points: [],
          challenges: [],
          opportunities: []
        },
        recommendations: [],
        next_steps: []
      }
    };

    console.log("Successfully generated response for agent:", {
      agentId: agentData.id,
      agentName: agentData.name,
      responseLength: response.conversationalResponse.length,
      hasStructuredOutput: !!response.structuredOutput,
      timestamp: new Date().toISOString()
    });

    return {
      agent: agentData.name,
      requirements,
      outputs: [
        {
          content: response.conversationalResponse,
          type: 'conversational'
        },
        {
          content: JSON.stringify(response.structuredOutput),
          type: 'structured'
        }
      ],
      stepId: agentData.id,
      orderIndex: previousOutputs.length
    };

  } catch (error) {
    console.error("Error in processAgent:", {
      error,
      agentId: agent?.id,
      briefId: brief?.id,
      stageId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}