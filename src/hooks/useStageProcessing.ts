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
    console.log("🚀 Starting stage processing:", {
      briefId,
      stageId,
      hasFeedback: !!feedbackId,
      feedbackId: feedbackId || null,
      timestamp: new Date().toISOString()
    });

    try {
      // Get the stage with its flow steps
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
        throw stageError;
      }

      if (!stage) {
        console.error("❌ Stage not found");
        throw new Error("Stage not found");
      }

      console.log("✅ Stage data retrieved:", {
        stageId: stage.id,
        flowStepsCount: stage.flows?.flow_steps?.length || 0
      });

      // Call the edge function with all necessary parameters
      console.log("🔄 Invoking edge function");
      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps: stage.flows?.flow_steps || [],
          feedbackId: typeof feedbackId === 'string' ? feedbackId : null
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw error;
      }

      console.log("✅ Edge function completed successfully");

      // Invalidate queries to refresh data
      console.log("🔄 Refreshing data");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brief-outputs"] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["stage-feedback"] })
      ]);

      toast.success(
        feedbackId 
          ? "Stage reprocessed successfully with feedback" 
          : "Stage processed successfully"
      );

    } catch (error) {
      console.error("❌ Error processing stage:", error);
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