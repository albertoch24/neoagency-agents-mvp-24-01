import { EnhancedAgentChain } from "./EnhancedAgentChain";

export class CollaborativeAgentNetwork {
  private agents: Map<string, EnhancedAgentChain>;
  
  constructor() {
    this.agents = new Map();
  }

  registerAgent(agentId: string) {
    if (!this.agents.has(agentId)) {
      this.agents.set(agentId, new EnhancedAgentChain());
    }
  }

  async processWithCollaboration(input: any, primaryAgentId: string, collaboratorIds: string[]) {
    console.log("Starting collaborative processing:", {
      primaryAgent: primaryAgentId,
      collaborators: collaboratorIds,
      inputType: typeof input
    });

    // Ensure primary agent exists
    this.registerAgent(primaryAgentId);
    
    // Get primary agent's processing
    const primaryAgent = this.agents.get(primaryAgentId)!;
    const primaryResult = await primaryAgent.processInput(input);

    // Collect insights from collaborators
    const collaborativeInsights = await Promise.all(
      collaboratorIds.map(async (collaboratorId) => {
        this.registerAgent(collaboratorId);
        const collaborator = this.agents.get(collaboratorId)!;
        return await collaborator.processInput({
          ...input,
          primaryAgentResult: primaryResult
        });
      })
    );

    // Combine results
    const finalResult = {
      primaryResult,
      collaborativeInsights,
      timestamp: new Date().toISOString()
    };

    console.log("Collaborative processing completed:", {
      primaryAgentId,
      collaboratorsCount: collaboratorIds.length,
      hasResults: !!finalResult
    });

    return finalResult;
  }
}