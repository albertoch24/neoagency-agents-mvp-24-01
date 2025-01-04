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

      // Fetch the flow directly from the database to ensure we have the latest data
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

      // Sort flow steps by order_index to ensure correct processing order
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

      // Log the prompts that will be used
      const { data: brief } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", briefId)
        .single();

      // Get previous stage outputs if not first stage
      const { data: previousOutputs } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });

      const isFirstStage = !previousOutputs || previousOutputs.length === 0;

      console.log("Stage processing context:", {
        isFirstStage,
        brief,
        previousOutputs,
        flowSteps: flowSteps.map(step => ({
          agentName: step.agents?.name,
          requirements: step.requirements
        }))
      });

      // Process the workflow stage with the sorted flow steps
      await processWorkflowStage(briefId, stageData, flowSteps);

      // Invalidate queries to refresh data
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