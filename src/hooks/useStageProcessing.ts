import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (feedbackId?: string | null) => {
    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      toast.error("Missing brief or stage ID");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(
      "Processing stage... This may take a few minutes.",
      { duration: 120000 }
    );

    try {
      // 1. First get the stage data
      console.log("🔍 Fetching stage data");
      const { data: stage, error: stageError } = await supabase
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
              description
            )
          )
        `)
        .eq("id", stageId)
        .single();

      if (stageError) {
        console.error("❌ Error fetching stage:", stageError);
        throw new Error("Failed to fetch stage data");
      }

      if (!stage) {
        console.error("❌ Stage not found");
        throw new Error("Stage not found");
      }

      console.log("✅ Stage data retrieved:", {
        stageId: stage.id,
        flowStepsCount: stage.flows?.flow_steps?.length || 0
      });

      // 2. Validate flow steps
      if (!stage.flows?.flow_steps?.length) {
        throw new Error("No flow steps found for this stage");
      }

      // 3. Call the edge function with proper typing for feedbackId
      console.log("🔄 Invoking edge function with params:", {
        briefId,
        stageId,
        flowStepsCount: stage.flows.flow_steps.length,
        feedbackId: feedbackId || null
      });

      const { error: functionError } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps: stage.flows.flow_steps,
          feedbackId: feedbackId || null // Ensure null is passed when undefined
        }
      });

      if (functionError) {
        console.error("❌ Edge function error:", functionError);
        throw functionError;
      }

      console.log("✅ Edge function completed successfully");

      // 4. Refresh data
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
      console.error("❌ Error processing stage:", error);
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Failed to process stage");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};