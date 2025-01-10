import { useState } from "react";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const useStageProcessing = (briefId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (nextStage: any) => {
    setIsProcessing(true);
    const toastId = toast.loading(
      `Processing ${nextStage.name} stage... This may take a few minutes. We're analyzing your brief and generating insights. Please don't close this window.`,
      { duration: 120000 } // 2 minutes
    );

    try {
      console.log("Processing stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flows: nextStage.flows
      });

      // Check for any pending clarifications
      const { data: clarifications, error: clarificationsError } = await supabase
        .from("stage_clarifications")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", nextStage.id)
        .eq("status", "pending");

      if (clarificationsError) throw clarificationsError;

      if (clarifications && clarifications.length > 0) {
        toast.dismiss(toastId);
        toast.info("Please answer the clarification questions before proceeding");
        setIsProcessing(false);
        return false;
      }

      // Fetch the flow directly from the database
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
        .maybeSingle();

      if (stageError) {
        console.error("Error fetching stage data:", stageError);
        throw new Error(`Error fetching stage data: ${stageError.message}`);
      }

      const flow = stageData?.flows;
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

      // Sort flow steps by order_index
      flowSteps.sort((a, b) => a.order_index - b.order_index);

      console.log("Found flow steps:", {
        stageId: nextStage.id,
        flowId: flow.id,
        stepsCount: flowSteps.length,
        steps: flowSteps.map(step => ({
          id: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index,
          requirements: step.requirements,
          agent: step.agents?.name
        }))
      });

      // Process the workflow stage
      await processWorkflowStage(briefId, stageData, flowSteps);

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });

      toast.dismiss(toastId);
      toast.success(`${nextStage.name} stage processed successfully! You can now view the results.`, {
        duration: 8000
      });

      setIsProcessing(false);
      return true;
    } catch (error) {
      console.error("Error processing stage:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error 
          ? `Failed to process stage: ${error.message}. Please try again or contact support.`
          : "Failed to process stage. Please try again or contact support.",
        { duration: 8000 }
      );
      setIsProcessing(false);
      return false;
    }
  };

  return { isProcessing, processStage };
};