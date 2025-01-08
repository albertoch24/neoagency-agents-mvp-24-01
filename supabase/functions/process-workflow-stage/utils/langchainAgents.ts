import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { DynamicStructuredTool } from "https://esm.sh/@langchain/core@0.1.18/tools";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export async function createAgentChain(agents: any[], brief: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  // Create a ChatOpenAI instance for each agent
  const agentModels = agents.map(agent => new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4o-mini",
    temperature: agent.temperature || 0.7,
    maxTokens: 2000,
  }));

  // Create tools for inter-agent communication
  const tools = agents.map((agent, index) => {
    return new DynamicStructuredTool({
      name: `consult_${agent.name.toLowerCase().replace(/\s+/g, '_')}`,
      description: `Consult with ${agent.name} about the project`,
      schema: z.object({
        question: z.string().describe("The question or topic to discuss with the agent"),
      }),
      func: async ({ question }) => {
        const response = await agentModels[index].invoke([
          {
            role: "system",
            content: `You are ${agent.name}. ${agent.description || ''} 
            Please provide both a conversational response and a structured analysis.
            For the structured analysis, focus on key points, metrics, and actionable items.`
          },
          {
            role: "user",
            content: question
          }
        ]);
        return response.content;
      }
    });
  });

  // Create the main executor that will manage agent interactions
  const executor = await initializeAgentExecutorWithOptions(
    tools,
    agentModels[0], // Use the first agent as the coordinator
    {
      agentType: "structured-chat-zero-shot-react-description",
      verbose: true,
      maxIterations: 5,
    }
  );

  return executor;
}

export async function processAgentInteractions(
  executor: any,
  brief: any,
  requirements: string
) {
  try {
    console.log('Processing agent interactions with requirements:', requirements);

    const result = await executor.invoke({
      input: `
        Project Brief: ${brief.title}
        Description: ${brief.description || ''}
        Objectives: ${brief.objectives || ''}
        Requirements: ${requirements}
        
        Please analyze this and provide:
        1. A conversational response with natural language and explanations
        2. A structured analysis with key points, metrics, and actionable items
        
        Format your response as:
        ---CONVERSATIONAL---
        [Your conversational response here]
        ---STRUCTURED---
        [Your structured analysis here]
      `
    });

    console.log('Raw agent response:', result.output);

    // Split the response into conversational and structured parts
    const parts = result.output.split('---STRUCTURED---');
    const conversationalPart = parts[0].replace('---CONVERSATIONAL---', '').trim();
    const structuredPart = (parts[1] || '').trim();

    return {
      outputs: [
        {
          content: conversationalPart,
          type: 'conversational'
        },
        {
          content: structuredPart,
          type: 'structured'
        }
      ]
    };
  } catch (error) {
    console.error('Error in agent interactions:', error);
    throw error;
  }
}