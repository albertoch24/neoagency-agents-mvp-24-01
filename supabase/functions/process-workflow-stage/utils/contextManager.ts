import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgentContext {
  agentId: string;
  previousOutputs: any[];
  conversationHistory: any[];
  requirements: string;
  metadata: Record<string, any>;
}

export interface SharedContext {
  briefId: string;
  stageId: string;
  contexts: Map<string, AgentContext>;
  globalMetadata: Record<string, any>;
}

export class ContextManager {
  private context: SharedContext;

  constructor(briefId: string, stageId: string) {
    this.context = {
      briefId,
      stageId,
      contexts: new Map(),
      globalMetadata: {}
    };
  }

  public initializeAgentContext(agentId: string, requirements: string): void {
    this.context.contexts.set(agentId, {
      agentId,
      previousOutputs: [],
      conversationHistory: [],
      requirements,
      metadata: {}
    });
  }

  public addOutput(agentId: string, output: any): void {
    const agentContext = this.context.contexts.get(agentId);
    if (agentContext) {
      agentContext.previousOutputs.push(output);
    }
  }

  public addToConversationHistory(agentId: string, conversation: any): void {
    const agentContext = this.context.contexts.get(agentId);
    if (agentContext) {
      agentContext.conversationHistory.push(conversation);
    }
  }

  public getAgentContext(agentId: string): AgentContext | undefined {
    return this.context.contexts.get(agentId);
  }

  public getAllContexts(): SharedContext {
    return this.context;
  }

  public setGlobalMetadata(key: string, value: any): void {
    this.context.globalMetadata[key] = value;
  }
}