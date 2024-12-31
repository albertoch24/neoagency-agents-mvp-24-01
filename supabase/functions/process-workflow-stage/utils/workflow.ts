import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log("Processing workflow with IDs:", {
    briefId: brief.id,
    stageId: stageId,
    flowId: brief.flow_id,
    agentId: agent.id,
    requirements: requirements
  });

  try {
    // Validate all required IDs exist
    if (!brief.id || !stageId || !brief.flow_id || !agent.id) {
      const missingIds = [];
      if (!brief.id) missingIds.push('briefId');
      if (!stageId) missingIds.push('stageId');
      if (!brief.flow_id) missingIds.push('flowId');
      if (!agent.id) missingIds.push('agentId');
      
      console.error("Missing required IDs:", missingIds);
      throw new Error(`Missing required IDs: ${missingIds.join(', ')}`);
    }

    // Log successful ID validation
    console.log("All required IDs validated successfully:", {
      brief: {
        id: brief.id,
        title: brief.title,
        flowId: brief.flow_id
      },
      stage: {
        id: stageId
      },
      agent: {
        id: agent.id,
        name: agent.name
      }
    });

    // Process the agent's skills
    if (agent.skills) {
      console.log("Processing agent skills:", agent.skills.map((skill: any) => ({
        skillId: skill.id,
        name: skill.name,
        type: skill.type
      })));
    }

    // Mock response for now - replace with actual agent processing logic
    const response = {
      outputs: [{
        content: `Processed by agent ${agent.name} for brief ${brief.title}`,
        timestamp: new Date().toISOString()
      }]
    };

    console.log("Workflow processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("Error in workflow processing:", {
      error: error.message,
      briefId: brief?.id,
      stageId: stageId,
      agentId: agent?.id
    });
    throw error;
  }
}