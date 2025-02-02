import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { BufferWindowMemory } from "https://esm.sh/langchain/memory";

interface AgentConfig {
  role: string;
  expertise: string[];
  temperature: number;
  description: string;
}

export class SpecializedAgent {
  private model: ChatOpenAI;
  private memory: BufferWindowMemory;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: config.temperature,
    });
    this.memory = new BufferWindowMemory({
      k: 5,
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output"
    });
  }

  async process(input: any, context?: any) {
    console.log(`🤖 ${this.config.role} processing:`, {
      inputPreview: JSON.stringify(input).substring(0, 100),
      contextExists: !!context,
      timestamp: new Date().toISOString()
    });

    // Carica la memoria precedente
    const history = await this.memory.loadMemoryVariables({});
    console.log(`📚 Memory loaded for ${this.config.role}:`, {
      historyLength: Object.keys(history).length
    });

    // Prepara il prompt con contesto e expertise
    const prompt = `
      You are a ${this.config.role} with expertise in: ${this.config.expertise.join(", ")}.
      ${this.config.description}
      
      Previous context:
      ${JSON.stringify(history)}
      
      Current input:
      ${JSON.stringify(input)}
      
      Provide your analysis and recommendations based on your expertise.
    `;

    // Processa con il modello
    const response = await this.model.invoke([
      {
        role: "system",
        content: prompt
      }
    ]);

    // Salva in memoria
    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: response.content }
    );

    console.log(`✅ ${this.config.role} completed processing:`, {
      responseLength: response.content.length,
      timestamp: new Date().toISOString()
    });

    return response.content;
  }

  async clearMemory() {
    await this.memory.clear();
  }
}

// Configurazioni predefinite per gli agenti
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  briefAnalyzer: {
    role: "Brief Analyzer",
    expertise: ["requirement analysis", "project scoping", "objective identification"],
    temperature: 0.3,
    description: "Specializes in analyzing briefs to extract key requirements and objectives."
  },
  creativeDirector: {
    role: "Creative Director",
    expertise: ["creative strategy", "brand voice", "content direction"],
    temperature: 0.7,
    description: "Guides creative direction and ensures brand consistency."
  },
  contentSpecialist: {
    role: "Content Specialist",
    expertise: ["content creation", "tone adaptation", "message clarity"],
    temperature: 0.5,
    description: "Creates and refines content based on brief requirements and creative direction."
  }
};