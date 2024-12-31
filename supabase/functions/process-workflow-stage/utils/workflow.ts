import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log("Starting agent processing with IDs:", {
    briefId: brief.id,
    stageId: stageId,
    agentId: agent.id,
    requirements: requirements
  });

  try {
    // Validate all required IDs exist
    if (!brief.id || !stageId || !agent.id) {
      const missingIds = [];
      if (!brief.id) missingIds.push('briefId');
      if (!stageId) missingIds.push('stageId');
      if (!agent.id) missingIds.push('agentId');
      
      console.error("Missing required IDs:", missingIds);
      throw new Error(`Missing required IDs: ${missingIds.join(', ')}`);
    }

    // Log successful ID validation
    console.log("All required IDs validated successfully:", {
      brief: {
        id: brief.id,
        title: brief.title,
        status: brief.status
      },
      stage: {
        id: stageId
      },
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description
      }
    });

    // Process the agent's skills
    if (agent.skills) {
      console.log("Processing agent skills:", agent.skills.map((skill: any) => ({
        skillId: skill.id,
        name: skill.name,
        type: skill.type
      })));
    } else {
      console.warn("Agent has no skills:", {
        agentId: agent.id,
        agentName: agent.name
      });
    }

    // Mock response for now - replace with actual agent processing logic
    const response = {
      outputs: [{
        content: `Processed by agent ${agent.name} for brief ${brief.title}`,
        timestamp: new Date().toISOString()
      }]
    };

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      response: response
    });

    return response;
  } catch (error) {
    console.error("Error in agent processing:", {
      error: error.message,
      briefId: brief?.id,
      stageId: stageId,
      agentId: agent?.id,
      stack: error.stack
    });
    throw error;
  }
}