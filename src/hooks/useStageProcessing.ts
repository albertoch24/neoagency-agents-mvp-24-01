import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStageValidation } from "./stage-processing/useStageValidation";
import { useStageDataFetching } from "./stage-processing/useStageDataFetching";
import { useEdgeFunctionCall } from "./stage-processing/useEdgeFunctionCall";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { validateStageData } = useStageValidation();
  const { fetchStageData } = useStageDataFetching();
  const { callEdgeFunction } = useEdgeFunctionCall();

  const processStage = async (feedbackId?: string | null) => {
    if (!validateStageData(briefId, stageId)) {
      return;
    }

    console.log("🚀 useStageProcessing - Starting stage processing:", {
      briefId,
      stageId,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    setIsProcessing(true);
    const toastId = toast.loading(
      "Processing stage... This may take a few minutes.",
      { duration: 120000 }
    );

    try {
      const stage = await fetchStageData(stageId);

      if (!stage) {
        throw new Error("Stage not found");
      }

      if (!stage.flows?.flow_steps?.length) {
        throw new Error("No flow steps found for this stage");
      }

      await callEdgeFunction(briefId, stage, stage.flows.flow_steps, feedbackId);

      // Refresh data
      console.log("🔄 Refreshing data");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brief-outputs"] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["stage-feedback"] })
      ]);

      toast.dismiss(toastId);
      toast.success(
        feedbackId 
          ? "Stage reprocessed successfully with feedback" 
          : "Stage processed successfully"
      );

    } catch (error) {
      console.error("❌ Error processing stage:", {
        error,
        stageId,
        timestamp: new Date().toISOString()
      });
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Failed to process stage");
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