import { createOpenAIClient, generateAgentResponse } from "./openai.ts";
import { saveConversation } from "./database.ts";

export async function processAgent(
  supabaseClient: any,
  agent: any,
  brief: any,
  stageId: string
) {
  console.log('Processing agent:', agent.name);

  try {
    const openai = createOpenAIClient();

    // Create personalized prompt for the agent
    const agentPrompt = `You are ${agent.name}, an expert with the following profile:
${agent.description}

Your skills include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join("\n") || "No specific skills listed"}

Please analyze the following brief and provide your expert perspective based on your role and skills:

Brief Title: ${brief.title}
Description: ${brief.description || "Not provided"}
Objectives: ${brief.objectives || "Not provided"}
Target Audience: ${brief.target_audience || "Not provided"}
Budget: ${brief.budget || "Not provided"}
Timeline: ${brief.timeline || "Not provided"}

Please provide a detailed analysis and recommendations from your specific perspective as ${agent.name}.`;

    // Get response from OpenAI
    const response = await generateAgentResponse(openai, agentPrompt);
    console.log('Received response from OpenAI for agent:', agent.name);

    // Save the conversation
    await saveConversation(supabaseClient, brief.id, stageId, agent.id, response);

    return {
      agent: agent.name,
      outputs: [{
        text: response
      }]
    };
  } catch (error) {
    console.error("Error processing agent:", error);
    throw error;
  }
}