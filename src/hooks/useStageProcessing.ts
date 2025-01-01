import { useState } from "react";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";
import { supabase } from "@/integrations/supabase/client";

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

      // Fetch the flow directly from the database if not already included
      let flow = nextStage.flows;
      if (!flow) {
        console.log("Fetching flow for stage:", nextStage.id);
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                agents (
                  id,
                  name,
                  description,
                  skills (*)
                )
              )
            )
          `)
          .eq("id", nextStage.id)
          .single();

        if (stageError) {
          console.error("Error fetching stage data:", stageError);
          throw new Error(`Error fetching stage data: ${stageError.message}`);
        }

        flow = stageData?.flows;
      }

      if (!flow) {
        console.error("No flow found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name
        });
        throw new Error(`No flow found for stage "${nextStage.name}"`);
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        console.error("No flow steps found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name,
          flowId: flow.id
        });
        throw new Error("No flow steps found for this stage");
      }

      console.log("Found flow steps:", {
        stageId: nextStage.id,
        flowId: flow.id,
        stepsCount: flowSteps.length,
        steps: flowSteps.map(step => ({
          id: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index
        }))
      });

      // Process the workflow stage
      await processWorkflowStage(briefId, nextStage, flowSteps);
      toast.success("Stage processed successfully!");
    } catch (error) {
      console.error("Error processing stage:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process stage");
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, processStage };
};