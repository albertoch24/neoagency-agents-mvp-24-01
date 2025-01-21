import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useStageProcessing = (briefId: string, stageId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (feedbackId: string | null = null) => {
    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      toast.error("Missing brief or stage ID");
      return;
    }

    setIsProcessing(true);
    console.log("🚀 Starting stage processing:", {
      briefId,
      stageId,
      feedbackId: feedbackId || 'none',
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Get stage data
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
        throw stageError;
      }

      console.log("✅ Stage data retrieved:", {
        stageId: stage.id,
        flowStepsCount: stage.flows?.flow_steps?.length || 0,
        feedbackId: feedbackId || 'none'
      });

      // 2. Validate flow steps
      if (!stage.flows?.flow_steps?.length) {
        throw new Error("No flow steps found for stage");
      }

      // 3. Call edge function
      const { data, error } = await supabase.functions.invoke('process-workflow-stage', {
        body: {
          briefId,
          stageId,
          flowSteps: stage.flows.flow_steps,
          feedbackId
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw error;
      }

      console.log("✅ Stage processing completed:", {
        briefId,
        stageId,
        feedbackId: feedbackId || 'none',
        timestamp: new Date().toISOString()
      });

      // 4. Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });

      toast.success("Stage processed successfully");
    } catch (error: any) {
      console.error("❌ Stage processing failed:", {
        error,
        briefId,
        stageId,
        feedbackId: feedbackId || 'none'
      });
      toast.error(error.message || "Failed to process stage");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};