import { BufferWindowMemory } from "langchain/memory";

export class AgentMemoryManager {
  private memory: BufferWindowMemory;
  
  constructor() {
    this.memory = new BufferWindowMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      k: 5
    });
  }

  async saveToMemory(input: any, output: any) {
    await this.memory.saveContext(
      { input: JSON.stringify(input) },
      { output: JSON.stringify(output) }
    );
  }

  async loadMemory() {
    return await this.memory.loadMemoryVariables({});
  }

  async clearMemory() {
    await this.memory.clear();
  }
}