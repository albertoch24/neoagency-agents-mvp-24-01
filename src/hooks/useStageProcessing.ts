import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (isReprocessing: boolean = false) => {
    if (!briefId || !stageId) {
      toast.error("Missing brief or stage ID");
      return;
    }

    setIsProcessing(true);
    console.log('Processing stage:', {
      briefId,
      stageId,
      isReprocessing,
      timestamp: new Date().toISOString()
    });

    try {
      // Get feedback if reprocessing
      let feedback = '';
      if (isReprocessing) {
        const { data: feedbackData } = await supabase
          .from('stage_feedback')
          .select('content, rating')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (feedbackData?.[0]) {
          feedback = `Previous feedback: ${feedbackData[0].content}
Rating: ${feedbackData[0].rating}/5
Please address this feedback specifically in your new response.`;
          
          console.log('Retrieved feedback for reprocessing:', {
            hasFeedback: !!feedback,
            feedbackPreview: feedback.substring(0, 100),
            rating: feedbackData[0].rating
          });
        }
      }

      // Fetch the stage with its flow steps
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

      // Get flow steps from the stage
      const flowSteps = stage.flows?.flow_steps || [];
      
      console.log('Retrieved flow steps for processing:', {
        stageId,
        flowStepsCount: flowSteps.length,
        flowSteps
      });

      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId,
          flowSteps,
          isReprocessing,
          feedback // Pass the feedback to the edge function
        }
      });

      if (error) throw error;

      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brief-outputs"] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] })
      ]);

      toast.success(
        isReprocessing 
          ? "Stage reprocessed successfully" 
          : "Stage processed successfully"
      );

    } catch (error) {
      console.error('Error processing stage:', error);
      toast.error(
        isReprocessing 
          ? "Failed to reprocess stage" 
          : "Failed to process stage"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};