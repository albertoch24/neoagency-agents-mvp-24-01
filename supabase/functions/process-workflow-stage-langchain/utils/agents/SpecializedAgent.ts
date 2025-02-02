import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { BufferWindowMemory } from "https://esm.sh/langchain@0.0.200/memory";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { AgentTools } from "./AgentTools.ts";

export class SpecializedAgent {
  private model: ChatOpenAI;
  private memory: BufferWindowMemory;
  public role: string;
  private expertise: string[];
  private executor: any;
  private agentId: string;

  constructor(role: string, expertise: string[], temperature = 0.7) {
    this.role = role;
    this.expertise = expertise;
    this.agentId = crypto.randomUUID();
    
    console.log(`🤖 Initializing ${role}:`, {
      agentId: this.agentId,
      expertise,
      temperature,
      timestamp: new Date().toISOString()
    });

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

    console.log(`✅ ${role} initialized:`, {
      agentId: this.agentId,
      hasModel: !!this.model,
      hasMemory: !!this.memory
    });
    
    this.initializeExecutor();
  }

  private async initializeExecutor() {
    console.log(`🔧 Initializing tools for ${this.role}...`, {
      agentId: this.agentId
    });
    
    const tools = [
      AgentTools.createSentimentAnalyzer(),
      AgentTools.createContextAnalyzer(),
      AgentTools.createContentOptimizer(),
      AgentTools.createFeedbackProcessor()
    ];

    console.log(`📊 Tools initialized for ${this.role}:`, {
      agentId: this.agentId,
      toolsCount: tools.length,
      toolNames: tools.map(t => t.name),
      timestamp: new Date().toISOString()
    });

    this.executor = await initializeAgentExecutorWithOptions(
      tools,
      this.model,
      {
        agentType: "structured-chat-zero-shot-react-description",
        verbose: true,
        maxIterations: 3,
      }
    );

    console.log(`✅ Executor initialized for ${this.role}:`, {
      agentId: this.agentId,
      hasExecutor: !!this.executor
    });
  }

  async process(input: any, context?: any, feedback?: string) {
    console.log(`🤖 ${this.role} processing:`, {
      agentId: this.agentId,
      inputPreview: JSON.stringify(input).substring(0, 100),
      contextAvailable: !!context,
      hasFeedback: !!feedback,
      timestamp: new Date().toISOString()
    });

    // Load previous memory
    const history = await this.memory.loadMemoryVariables({});
    console.log(`📚 ${this.role} memory loaded:`, {
      agentId: this.agentId,
      historyLength: JSON.stringify(history).length,
      hasHistory: !!history.chat_history,
      timestamp: new Date().toISOString()
    });

    // Process with executor
    const result = await this.executor.invoke({
      input: this.buildPrompt(input, context, history, feedback)
    });

    // Save context to memory
    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: result.output }
    );

    console.log(`✅ ${this.role} completed processing:`, {
      agentId: this.agentId,
      responsePreview: result.output.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    return result.output;
  }

  private buildPrompt(input: any, context?: any, history?: any, feedback?: string): string {
    const prompt = `
      Input: ${JSON.stringify(input)}
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      ${history.chat_history ? `Previous interactions: ${JSON.stringify(history.chat_history)}` : ''}
      ${feedback ? `Previous feedback: ${feedback}` : ''}
      
      Based on your expertise as ${this.role}, analyze this information and provide insights.
      Focus on: ${this.expertise.join(", ")}
      
      ${feedback ? 'Consider and address the previous feedback in your response.' : ''}
      
      Use the available tools to:
      1. Analyze the context and requirements
      2. Check the sentiment and tone
      3. Optimize the content based on analysis
      4. Process and incorporate any feedback
    `;

    console.log(`📝 ${this.role} prompt built:`, {
      agentId: this.agentId,
      promptLength: prompt.length,
      hasContext: !!context,
      hasFeedback: !!feedback,
      timestamp: new Date().toISOString()
    });

    return prompt;
  }
}