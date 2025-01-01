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
      status: brief.status,
      current_stage: brief.current_stage
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

    // Log current stage status
    console.log("Current stage status:", {
      stageId: stageId,
      briefCurrentStage: brief.current_stage,
      timestamp: new Date().toISOString()
    });

    // Construct conversational prompt for detailed analysis
    const conversationalPrompt = `
      As ${agent.name}, analyze this creative brief in a conversational, professional manner:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      ${agent.description}
      
      Share your thoughts and insights as if you're speaking in a creative agency meeting.
      After your detailed analysis, provide a concise, bullet-pointed summary of key points.
    `;

    console.log("Generating response with conversational prompt:", conversationalPrompt);

    // Generate response using OpenAI
    const content = await generateAgentResponse(conversationalPrompt);
    
    console.log("Generated agent response:", {
      agentId: agent.id,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    // Split the response into conversational analysis and summary
    const [analysis, summary] = content.split(/###\s*Summary:/i);

    // Format the response to include both conversational analysis and structured summary
    const formattedResponse = {
      outputs: [{
        content: `${analysis.trim()}\n\n### Summary:\n${summary ? summary.trim() : ''}`,
        timestamp: new Date().toISOString()
      }]
    };

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      outputSize: formattedResponse.outputs.length,
      timestamp: new Date().toISOString()
    });

    return formattedResponse;
  } catch (error) {
    console.error("Error in agent processing:", {
      error: error.message,
      briefId: brief?.id,
      stageId: stageId,
      agentId: agent?.id,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}