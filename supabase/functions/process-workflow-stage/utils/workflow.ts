import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAgentResponse } from "./openai.ts";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log("Starting agent processing with full context:", {
    brief: {
      id: brief.id,
      title: brief.title,
      description: brief.description,
      objectives: brief.objectives,
      status: brief.status
    },
    stage: {
      id: stageId
    },
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      skillCount: agent.skills?.length || 0
    }
  });

  try {
    // Validate all required data exists
    if (!brief.id || !stageId || !agent.id) {
      const missingData = [];
      if (!brief.id) missingData.push('briefId');
      if (!stageId) missingData.push('stageId');
      if (!agent.id) missingData.push('agentId');
      
      console.error("Missing required data:", missingData);
      throw new Error(`Missing required data: ${missingData.join(', ')}`);
    }

    // Log agent skills
    if (agent.skills && agent.skills.length > 0) {
      console.log("Processing agent skills:", agent.skills.map((skill: any) => ({
        skillId: skill.id,
        name: skill.name,
        type: skill.type,
        hasContent: !!skill.content
      })));
    } else {
      console.warn("Agent has no skills:", {
        agentId: agent.id,
        agentName: agent.name
      });
    }

    // Construct prompt from brief and agent data
    const prompt = `
      As ${agent.name}, analyze this creative brief:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      ${agent.description}
      
      Provide a detailed analysis and recommendations.
    `;

    console.log("Generating response with prompt:", prompt);

    // Generate response using OpenAI
    const content = await generateAgentResponse(prompt);
    
    console.log("Generated agent response:", {
      agentId: agent.id,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    const response = {
      outputs: [{
        content: content,
        timestamp: new Date().toISOString()
      }]
    };

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      outputSize: response.outputs.length,
      timestamp: new Date().toISOString()
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