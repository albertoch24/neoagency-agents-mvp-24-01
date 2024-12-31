import { generateAgentResponse } from "./openai.ts";
import { saveConversation } from "./database.ts";

export async function processAgent(
  supabaseClient: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log('Processing agent:', agent.name);

  try {
    // Create personalized prompt for the agent
    const agentPrompt = `You are ${agent.name}, an expert with the following profile:
${agent.description}

Your skills include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join("\n") || "No specific skills listed"}

Requirements for this step:
${requirements || "No specific requirements provided"}

Please analyze the following brief and provide your expert perspective based on your role, skills, and the requirements:

Brief Title: ${brief.title}
Description: ${brief.description || "Not provided"}
Objectives: ${brief.objectives || "Not provided"}
Target Audience: ${brief.target_audience || "Not provided"}
Budget: ${brief.budget || "Not provided"}
Timeline: ${brief.timeline || "Not provided"}

Please provide a detailed analysis and recommendations from your specific perspective as ${agent.name}, focusing on the requirements provided.`;

    // Get response from OpenAI
    const response = await generateAgentResponse(agentPrompt);
    
    if (!response) {
      throw new Error(`Failed to get response from agent ${agent.name}`);
    }
    
    console.log('Received response from OpenAI for agent:', agent.name);

    return {
      agent: agent.name,
      outputs: [{
        text: "Analysis and Recommendations",
        content: response
      }]
    };
  } catch (error) {
    console.error("Error processing agent:", error);
    // Return a default error message instead of null
    return {
      agent: agent.name,
      outputs: [{
        text: "Error",
        content: `Failed to process agent ${agent.name}: ${error.message || 'Unknown error'}`
      }]
    };
  }
}