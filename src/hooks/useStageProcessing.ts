import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useStageProcessing = (briefId: string, stageId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (feedbackId: string | null = null) => {
    // Validate input parameters
    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      toast.error("Missing required parameters");
      return;
    }

    // Validate feedbackId if provided
    if (feedbackId !== null && typeof feedbackId !== 'string') {
      console.error("❌ Invalid feedback ID type:", { feedbackId, type: typeof feedbackId });
      toast.error("Invalid feedback ID");
      return;
    }

    const operationId = `workflow_stage_${Date.now()}`;
    setIsProcessing(true);
    
    console.log("🚀 Starting stage processing:", {
      operationId,
      briefId,
      stageId,
      feedbackId: feedbackId || 'none',
      timestamp: new Date().toISOString()
    });

    try {
      // Get stage data with flow steps
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
        .maybeSingle();

      if (stageError) {
        console.error("❌ Error fetching stage:", stageError);
        throw stageError;
      }

      if (!stage) {
        console.error("❌ Stage not found:", { stageId });
        throw new Error("Stage not found");
      }

      console.log("✅ Stage data retrieved:", {
        operationId,
        stageId: stage.id,
        stageName: stage.name,
        flowStepsCount: stage.flows?.flow_steps?.length || 0
      });

      if (!stage.flows?.flow_steps?.length) {
        console.error("❌ No flow steps found for stage:", { stageId });
        throw new Error("No flow steps found for stage");
      }

      // Call edge function with validated parameters
      const { data, error } = await supabase.functions.invoke('process-workflow-stage', {
        body: {
          briefId,
          stageId,
          flowSteps: stage.flows.flow_steps,
          feedbackId: feedbackId
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw error;
      }

      console.log("✅ Stage processing completed:", {
        operationId,
        briefId,
        stageId,
        feedbackId: feedbackId || 'none',
        timestamp: new Date().toISOString()
      });

      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["brief-outputs"] }),
        queryClient.invalidateQueries({ queryKey: ["brief"] })
      ]);

      toast.success("Stage processed successfully");
    } catch (error: any) {
      console.error("❌ Stage processing failed:", {
        operationId,
        briefId,
        stageId,
        error,
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