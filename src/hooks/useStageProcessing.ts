import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStageDataFetching } from "./stage-processing/useStageDataFetching";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchStageData } = useStageDataFetching();

  const processStage = async (feedbackId: string | null) => {
    if (!briefId || !stageId) {
      console.error("Missing required parameters:", { briefId, stageId });
      return;
    }

    setIsProcessing(true);
    console.log("Starting stage processing:", {
      briefId,
      stageId,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    try {
      // Fetch stage data including flow steps
      const stage = await fetchStageData(stageId);
      
      if (!stage?.flow_id) {
        console.error("No flow_id found for stage:", {
          stageId,
          stageName: stage?.name
        });
        throw new Error("No flow_id found for this stage");
      }

      // Fetch flow steps using the correct flow_id
      const { data: flowSteps, error: flowStepsError } = await supabase
        .from("flow_steps")
        .select(`
          id,
          agent_id,
          requirements,
          order_index,
          outputs,
          description,
          agents (
            id,
            name,
            description
          )
        `)
        .eq("flow_id", stage.flow_id)
        .order("order_index", { ascending: true });

      if (flowStepsError || !flowSteps?.length) {
        console.error("Error fetching flow steps:", {
          error: flowStepsError,
          stageId,
          flowId: stage.flow_id
        });
        throw new Error("Failed to fetch flow steps");
      }

      console.log("Retrieved flow steps:", {
        stageId,
        stageName: stage.name,
        flowId: stage.flow_id,
        flowStepsCount: flowSteps.length,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps,
          feedbackId: feedbackId || null
        }
      });

      if (error) {
        console.error("Error processing stage:", error);
        throw error;
      }

      toast.success("Stage processed successfully!");
    } catch (error) {
      console.error("Error in processStage:", error);
      toast.error("Failed to process stage");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};