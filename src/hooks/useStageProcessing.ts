import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (feedbackId?: string) => {
    if (!briefId || !stageId) {
      toast.error("Missing brief or stage ID");
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
      // If there's feedback, mark previous outputs as reprocessed
      if (feedbackId) {
        console.log("Marking previous outputs as reprocessed");
        const { error: updateError } = await supabase
          .from("brief_outputs")
          .update({ 
            is_reprocessed: true,
            reprocessed_at: new Date().toISOString()
          })
          .eq("brief_id", briefId)
          .eq("stage_id", stageId)
          .is("feedback_id", null);

        if (updateError) {
          console.error("Error updating previous outputs:", updateError);
          throw updateError;
        }
      }

      // Get the stage with its flow steps
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
        console.error("Error fetching stage:", stageError);
        throw stageError;
      }

      if (!stage) {
        throw new Error("Stage not found");
      }

      // Call the edge function with all necessary parameters
      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps: stage.flows?.flow_steps || [],
          feedbackId
        }
      });

      if (error) throw error;

      // Invalidate queries to refresh data
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
      console.error("Error processing stage:", error);
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