import { useState } from "react";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";

export const useStageProcessing = (briefId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processStage = async (nextStage: any) => {
    setIsProcessing(true);
    try {
      console.log("Processing stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flows: nextStage.flows
      });

      // Get the flow and flow steps for the next stage
      const flow = nextStage.flows?.[0];
      if (!flow) {
        console.error("No flow found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name
        });
        toast.error(`No workflow found for stage "${nextStage.name}". Please configure a workflow for this stage first.`);
        throw new Error(`No flow found for stage "${nextStage.name}"`);
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        console.error("No flow steps found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name,
          flowId: flow.id
        });
        toast.error(`No workflow steps found for stage "${nextStage.name}". Please add steps to the workflow.`);
        throw new Error("No flow steps found for this stage");
      }

      // Process the workflow stage
      await processWorkflowStage(briefId, nextStage, flowSteps);
      toast.success("Stage processed successfully!");
    } catch (error) {
      console.error("Error processing stage:", error);
      toast.error("Failed to process stage");
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, processStage };
};