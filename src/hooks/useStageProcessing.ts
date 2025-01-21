import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const validateStageData = (briefId?: string, stageId?: string) => {
    console.log("🔍 Validating stage data:", { briefId, stageId });
    
    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      toast.error("Missing required parameters");
      return false;
    }
    return true;
  };

  const fetchStageData = async (stageId: string) => {
    console.log("📥 Fetching stage data for:", stageId);
    
    const { data: stage, error } = await supabase
      .from("stages")
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (*)
        )
      `)
      .eq("id", stageId)
      .single();

    if (error) {
      console.error("❌ Error fetching stage:", error);
      throw error;
    }

    if (!stage) {
      console.error("❌ Stage not found:", stageId);
      throw new Error("Stage not found");
    }

    console.log("✅ Stage data retrieved:", {
      stageName: stage.name,
      flowId: stage.flow_id,
      flowStepsCount: stage.flows?.flow_steps?.length
    });

    return stage;
  };

  const processStage = async (feedbackId?: string | null) => {
    if (!validateStageData(briefId, stageId)) {
      return;
    }

    console.log("🚀 Starting stage processing:", {
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

      console.log("📤 Calling edge function with:", {
        briefId,
        stageId,
        flowStepsCount: stage.flows.flow_steps.length,
        timestamp: new Date().toISOString()
      });

      const { data, error: functionError } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId: stage.id,
          flowSteps: stage.flows.flow_steps,
          feedbackId: feedbackId || null
        }
      });

      if (functionError) {
        console.error("❌ Edge function error:", {
          error: functionError,
          stageId: stage.id,
          timestamp: new Date().toISOString()
        });
        throw functionError;
      }

      console.log("✅ Edge function completed successfully:", {
        stageId: stage.id,
        stageName: stage.name,
        response: data,
        timestamp: new Date().toISOString()
      });

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