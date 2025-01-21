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
      
      if (!stage?.flows?.flow_steps) {
        console.error("No flow steps found for stage:", {
          stageId,
          stageName: stage?.name
        });
        throw new Error("No flow steps found for this stage");
      }

      console.log("Retrieved stage data:", {
        stageId,
        stageName: stage.name,
        flowStepsCount: stage.flows.flow_steps.length,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps: stage.flows.flow_steps,
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