import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { BufferWindowMemory } from "https://esm.sh/langchain@0.0.200/memory";

export class SpecializedAgent {
  private model: ChatOpenAI;
  private memory: BufferWindowMemory;
  private role: string;
  private expertise: string[];

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
  }

  async process(input: any, context?: any) {
    console.log(`🤖 ${this.role} processing:`, {
      inputPreview: JSON.stringify(input).substring(0, 100),
      contextAvailable: !!context,
      timestamp: new Date().toISOString()
    });

    // Carica la memoria precedente
    const history = await this.memory.loadMemoryVariables({});
    console.log(`📚 ${this.role} memory loaded:`, {
      historyLength: JSON.stringify(history).length,
      timestamp: new Date().toISOString()
    });

    // Prepara il prompt con contesto e memoria
    const prompt = this.buildPrompt(input, context, history);

    // Processa con il modello
    const response = await this.model.invoke([
      {
        role: "system",
        content: `You are a ${this.role} with expertise in: ${this.expertise.join(", ")}. 
                 Use your specific knowledge to analyze and respond.`
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    // Salva il contesto in memoria
    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: response.content }
    );

    console.log(`✅ ${this.role} completed processing:`, {
      responsePreview: response.content.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    return response.content;
  }

  private buildPrompt(input: any, context?: any, history?: any): string {
    return `
      Input: ${JSON.stringify(input)}
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      ${history.chat_history ? `Previous interactions: ${JSON.stringify(history.chat_history)}` : ''}
      
      Based on your expertise as ${this.role}, analyze this information and provide insights.
      Focus on: ${this.expertise.join(", ")}
    `;
  }
}