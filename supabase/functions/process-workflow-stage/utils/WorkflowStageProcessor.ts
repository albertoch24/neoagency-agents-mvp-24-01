import { BaseLangChainProcessor } from "./BaseLangChainProcessor.ts";

export class WorkflowStageProcessor extends BaseLangChainProcessor {
  constructor() {
    super(0.7); // Default temperature for workflow processing
  }

  async processStage(stageData: any, briefData: any) {
    // Set the context for this stage processing
    this.setContext({
      stageId: stageData.id,
      briefId: briefData.id,
      stageName: stageData.name,
    });

    // Initialize with stage-specific prompt template
    await this.initialize(`
      Process the following workflow stage:
      Stage: {stageName}
      Brief: {briefTitle}
      Description: {briefDescription}
      
      Previous context: {context}
      
      Requirements:
      {requirements}
      
      Generate a detailed response that:
      1. Addresses the stage requirements
      2. Aligns with the brief objectives
      3. Maintains consistency with previous stages
      4. Provides actionable next steps
    `);

    // Process the stage with relevant data
    return await this.process({
      stageName: stageData.name,
      briefTitle: briefData.title,
      briefDescription: briefData.description,
      context: JSON.stringify(this.getContext()),
      requirements: stageData.requirements || "",
    });
  }
}