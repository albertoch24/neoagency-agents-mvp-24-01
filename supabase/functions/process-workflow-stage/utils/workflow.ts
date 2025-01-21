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

    // Parse requirements into sections
    const requirementSections = requirements.split('\n\n').filter(Boolean);
    
    // Process each requirement section
    const processedRequirements = requirementSections.map(section => {
      const [title, ...points] = section.split('\n');
      return {
        title: title.replace(':', '').trim(),
        points: points.filter(p => p.trim()).map(p => p.trim().replace(/^[•-]\s*/, ''))
      };
    });

    // Generate structured response based on requirements
    const response = {
      conversationalResponse: `As ${agentData.name}, I have analyzed the brief and requirements. Here is my detailed response:\n\n${
        processedRequirements.map(section => 
          `${section.title}:\n${section.points.map(point => `- ${point}`).join('\n')}`
        ).join('\n\n')
      }`,
      structuredOutput: {
        analysis: {
          key_points: processedRequirements.flatMap(section => section.points),
          challenges: [],
          opportunities: []
        },
        recommendations: processedRequirements.map(section => ({
          category: section.title,
          points: section.points
        })),
        next_steps: processedRequirements
          .find(section => section.title.toLowerCase().includes('next'))?.points || []
      }
    };

    console.log("Successfully generated response for agent:", {
      agentId: agentData.id,
      agentName: agentData.name,
      responseLength: response.conversationalResponse.length,
      hasStructuredOutput: !!response.structuredOutput,
      requirementSectionsCount: processedRequirements.length,
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