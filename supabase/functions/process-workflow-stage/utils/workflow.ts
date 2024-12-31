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
  console.log('Flow step requirements:', requirements);

  try {
    // Create personalized prompt for the agent
    const agentPrompt = `You are ${agent.name}, an expert with the following profile:
${agent.description}

Your skills include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join("\n") || "No specific skills listed"}

Your task requirements for this step:
${requirements || "No specific requirements provided"}

Please analyze the following brief based on the requirements above and provide your expert perspective:

Brief Title: ${brief.title}
Description: ${brief.description || "Not provided"}
Objectives: ${brief.objectives || "Not provided"}
Target Audience: ${brief.target_audience || "Not provided"}
Budget: ${brief.budget || "Not provided"}
Timeline: ${brief.timeline || "Not provided"}

Based on the requirements provided and your expertise as ${agent.name}, please provide:
1. A detailed analysis of the brief
2. Specific recommendations aligned with the requirements
3. Any concerns or potential challenges you identify
4. Actionable next steps`;

    console.log('Generating response for prompt:', agentPrompt);
    
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