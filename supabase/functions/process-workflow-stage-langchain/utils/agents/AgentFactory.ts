export class AgentFactory {
  static createAgent(agentId: string, requirements: string) {
    return {
      id: agentId,
      role: "AI Assistant",
      name: "AI Assistant",
      description: requirements || "A helpful AI assistant",
      temperature: 0.7,
      skills: []
    };
  }
}