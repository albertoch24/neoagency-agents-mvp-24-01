import { ContextManager } from "./contextManager.ts";

interface ProcessingNode {
  agentId: string;
  dependencies: string[];
  processed: boolean;
  processing: boolean;
  error?: Error;
}

export class ParallelProcessor {
  private nodes: Map<string, ProcessingNode>;
  private contextManager: ContextManager;

  constructor(contextManager: ContextManager) {
    this.nodes = new Map();
    this.contextManager = contextManager;
  }

  public addNode(agentId: string, dependencies: string[] = []): void {
    this.nodes.set(agentId, {
      agentId,
      dependencies,
      processed: false,
      processing: false
    });
  }

  private getReadyNodes(): ProcessingNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      !node.processed && 
      !node.processing && 
      node.dependencies.every(depId => 
        this.nodes.get(depId)?.processed
      )
    );
  }

  public async processNodes(
    processFn: (agentId: string, context: ContextManager) => Promise<any>
  ): Promise<Map<string, any>> {
    const results = new Map();
    
    while (this.getReadyNodes().length > 0) {
      const readyNodes = this.getReadyNodes();
      console.log(`Processing batch of ${readyNodes.length} nodes`);
      
      try {
        const processingPromises = readyNodes.map(async node => {
          node.processing = true;
          try {
            const result = await processFn(node.agentId, this.contextManager);
            node.processed = true;
            results.set(node.agentId, result);
          } catch (error) {
            node.error = error as Error;
            console.error(`Error processing node ${node.agentId}:`, error);
          } finally {
            node.processing = false;
          }
        });

        await Promise.all(processingPromises);
      } catch (error) {
        console.error("Batch processing error:", error);
        throw error;
      }
    }

    // Check for unprocessed nodes due to circular dependencies
    const unprocessed = Array.from(this.nodes.values())
      .filter(node => !node.processed);
    
    if (unprocessed.length > 0) {
      console.error("Unprocessed nodes detected:", unprocessed);
      throw new Error("Circular dependency or processing error detected");
    }

    return results;
  }

  public getProgress(): {
    total: number;
    processed: number;
    processing: number;
    failed: number;
  } {
    const nodes = Array.from(this.nodes.values());
    return {
      total: nodes.length,
      processed: nodes.filter(n => n.processed).length,
      processing: nodes.filter(n => n.processing).length,
      failed: nodes.filter(n => n.error).length
    };
  }
}