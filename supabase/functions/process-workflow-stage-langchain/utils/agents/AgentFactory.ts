import { SpecializedAgent } from "./SpecializedAgent.ts";

export class AgentFactory {
  static createAgent(agentId: string, requirements: string): SpecializedAgent {
    // Map agent IDs to specific agent types
    const agentMap: Record<string, () => SpecializedAgent> = {
      "brief_analyzer": () => new SpecializedAgent(
        "Brief Analyzer",
        ["requirement analysis", "project scoping"],
        0.3
      ),
      "creative_director": () => new SpecializedAgent(
        "Creative Director",
        ["creative strategy", "brand voice"],
        0.7
      ),
      "content_specialist": () => new SpecializedAgent(
        "Content Specialist",
        ["content creation", "tone adaptation"],
        0.5
      )
    };

    // Default to content specialist if agent type not found
    const createAgent = agentMap[agentId] || agentMap.content_specialist;
    return createAgent();
  }
}