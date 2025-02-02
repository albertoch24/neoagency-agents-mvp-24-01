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

  const agentModels = agents.map(agent => new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4",
    temperature: agent.temperature || 0.7,
    maxTokens: 2000,
  }));

  const tools = agents.map((agent, index) => {
    console.log('Creating tool for agent:', {
      agentName: agent.name,
      temperature: agent.temperature,
      skillsCount: agent.skills?.length
    });

    return new DynamicStructuredTool({
      name: `consult_${agent.name.toLowerCase().replace(/\s+/g, '_')}`,
      description: `Consult with ${agent.name} about the project`,
      schema: z.object({
        question: z.string().describe("The question or topic to discuss with the agent"),
      }),
      func: async ({ question }) => {
        console.log('Tool execution for agent:', {
          agentName: agent.name,
          questionLength: question.length,
          questionPreview: question.substring(0, 100)
        });

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

        console.log('Tool response received:', {
          agentName: agent.name,
          responseLength: response.content.length,
          responsePreview: response.content.substring(0, 100)
        });

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