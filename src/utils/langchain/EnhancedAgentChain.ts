import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { AgentMemoryManager } from "./AgentMemoryManager";
import { PromptTemplate } from "@langchain/core/prompts";

export class EnhancedAgentChain {
  private model: ChatOpenAI;
  private memory: AgentMemoryManager;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7
    });
    this.memory = new AgentMemoryManager();
  }

  private async reasoningStep(input: any) {
    const reasoningPrompt = PromptTemplate.fromTemplate(`
      Analyze the following input and context:
      Input: {input}
      Previous Context: {context}
      
      Think step by step:
      1. What are the key elements to consider?
      2. How does this relate to previous interactions?
      3. What approach would be most effective?
      
      Reasoning:
    `);

    return await this.model.invoke(reasoningPrompt.format({
      input: JSON.stringify(input),
      context: JSON.stringify(await this.memory.loadMemory())
    }));
  }

  private async actionStep(reasoning: any, input: any) {
    const actionPrompt = PromptTemplate.fromTemplate(`
      Based on the reasoning:
      {reasoning}
      
      And the input:
      {input}
      
      Take the most appropriate action:
    `);

    return await this.model.invoke(actionPrompt.format({
      reasoning: JSON.stringify(reasoning),
      input: JSON.stringify(input)
    }));
  }

  private async reflectionStep(action: any, result: any) {
    const reflectionPrompt = PromptTemplate.fromTemplate(`
      Review the action taken:
      {action}
      
      And its result:
      {result}
      
      Reflect on:
      1. Was this effective?
      2. What could be improved?
      3. What should be remembered for future interactions?
      
      Reflection:
    `);

    return await this.model.invoke(reflectionPrompt.format({
      action: JSON.stringify(action),
      result: JSON.stringify(result)
    }));
  }

  async processInput(input: any) {
    const chain = RunnableSequence.from([
      {
        reasoning: async (i: any) => await this.reasoningStep(i),
        memory: async () => await this.memory.loadMemory()
      },
      {
        action: async (prev: any) => await this.actionStep(prev.reasoning, input),
        reasoning: (prev: any) => prev.reasoning,
        memory: (prev: any) => prev.memory
      },
      {
        reflection: async (prev: any) => await this.reflectionStep(prev.action, prev.reasoning),
        result: (prev: any) => prev.action
      }
    ]);

    const result = await chain.invoke(input);

    await this.memory.saveToMemory(input, result);

    return result;
  }
}