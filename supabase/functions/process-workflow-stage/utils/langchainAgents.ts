import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { DynamicStructuredTool } from "https://esm.sh/@langchain/core@0.1.18/tools";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export async function createAgentChain(agents: any[], brief: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  const agentModels = agents.map(agent => new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4o-mini",
    temperature: agent.temperature || 0.7,
    maxTokens: 2000,
  }));

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
            Please provide a natural, conversational response that explains your thoughts and recommendations.`
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

  const executor = await initializeAgentExecutorWithOptions(
    tools,
    agentModels[0],
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
        
        Please analyze this and provide a detailed response with your thoughts, recommendations, and insights.
        Focus on being clear, specific, and actionable in your response.
      `
    });

    console.log('Raw agent response:', result.output);

    return {
      outputs: [
        {
          content: result.output,
          type: 'conversational'
        }
      ]
    };
  } catch (error) {
    console.error('Error in agent interactions:', error);
    throw error;
  }
}