import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { BufferWindowMemory } from "https://esm.sh/langchain@0.0.200/memory";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { AgentTools } from "./AgentTools.ts";

export class SpecializedAgent {
  private model: ChatOpenAI;
  private memory: BufferWindowMemory;
  private role: string;
  private expertise: string[];
  private executor: any;

  constructor(role: string, expertise: string[], temperature = 0.7) {
    this.role = role;
    this.expertise = expertise;
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature,
    });
    this.memory = new BufferWindowMemory({
      k: 5,
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
    });
    this.initializeExecutor();
  }

  private async initializeExecutor() {
    const tools = [
      AgentTools.createSentimentAnalyzer(),
      AgentTools.createContextAnalyzer(),
      AgentTools.createContentOptimizer()
    ];

    this.executor = await initializeAgentExecutorWithOptions(
      tools,
      this.model,
      {
        agentType: "structured-chat-zero-shot-react-description",
        verbose: true,
        maxIterations: 3,
      }
    );
  }

  async process(input: any, context?: any) {
    console.log(`🤖 ${this.role} processing:`, {
      inputPreview: JSON.stringify(input).substring(0, 100),
      contextAvailable: !!context,
      timestamp: new Date().toISOString()
    });

    // Load previous memory
    const history = await this.memory.loadMemoryVariables({});
    console.log(`📚 ${this.role} memory loaded:`, {
      historyLength: JSON.stringify(history).length,
      timestamp: new Date().toISOString()
    });

    // Process with executor
    const result = await this.executor.invoke({
      input: this.buildPrompt(input, context, history)
    });

    // Save context to memory
    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: result.output }
    );

    console.log(`✅ ${this.role} completed processing:`, {
      responsePreview: result.output.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    return result.output;
  }

  private buildPrompt(input: any, context?: any, history?: any): string {
    return `
      Input: ${JSON.stringify(input)}
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      ${history.chat_history ? `Previous interactions: ${JSON.stringify(history.chat_history)}` : ''}
      
      Based on your expertise as ${this.role}, analyze this information and provide insights.
      Focus on: ${this.expertise.join(", ")}
      
      Use the available tools to:
      1. Analyze the context and requirements
      2. Check the sentiment and tone
      3. Optimize the content based on analysis
    `;
  }
}