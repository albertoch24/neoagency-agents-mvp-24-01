import { BufferWindowMemory } from "langchain/memory";

export class AgentMemoryManager {
  private memory: BufferWindowMemory;
  
  constructor() {
    console.log("🧠 Initializing AgentMemoryManager");
    this.memory = new BufferWindowMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      k: 5
    });
  }

  async saveToMemory(input: any, output: any) {
    console.log("💾 Saving to memory:", {
      inputPreview: typeof input === 'string' ? input.substring(0, 100) : 'Complex input',
      outputPreview: typeof output === 'string' ? output.substring(0, 100) : 'Complex output',
      timestamp: new Date().toISOString()
    });

    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: JSON.stringify(output) }
    );
  }

  async loadMemory() {
    const memory = await this.memory.loadMemoryVariables({});
    console.log("📖 Loading memory:", {
      historyLength: memory.chat_history?.length || 0,
      timestamp: new Date().toISOString()
    });
    return memory;
  }

  async clearMemory() {
    console.log("🧹 Clearing memory");
    await this.memory.clear();
  }
}