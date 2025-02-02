import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { DynamicStructuredTool } from "https://esm.sh/@langchain/core@0.1.18/tools";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export async function processAgentInteractions(agents: any[], brief: any, flowSteps: any[]) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  console.log('Creating agent chain with:', {
    agentCount: agents.length,
    briefTitle: brief.title
  });

  const model = new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4o-mini",
    temperature: 0.7,
  });

  const tools = agents.map((agent, index) => {
    return new DynamicStructuredTool({
      name: `consult_${agent.role.toLowerCase().replace(/\s+/g, '_')}`,
      description: `Consult with ${agent.role} about the project`,
      schema: z.object({
        question: z.string().describe("The question or topic to discuss with the agent"),
      }),
      func: async ({ question }) => {
        const response = await model.invoke([
          {
            role: "system",
            content: `You are ${agent.role}. Please provide insights and recommendations.`
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

  return await initializeAgentExecutorWithOptions(
    tools,
    model,
    {
      agentType: "structured-chat-zero-shot-react-description",
      verbose: true,
      maxIterations: 5,
    }
  );
}