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

      // Get flow steps from the stage
      const flowSteps = stage.flows?.flow_steps || [];
      
      console.log('Retrieved flow steps for processing:', {
        stageId,
        flowStepsCount: flowSteps.length,
        flowSteps
      });

      // If reprocessing, get the most recent feedback
      let feedback = '';
      if (isReprocessing) {
        console.log('Fetching feedback for reprocessing');
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('stage_feedback')
          .select('content, rating')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (feedbackError) {
          console.error('Error fetching feedback:', feedbackError);
        } else if (feedbackData?.[0]) {
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

      // Call the edge function with all necessary parameters
      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId,
          flowSteps,
          isReprocessing,
          feedback
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