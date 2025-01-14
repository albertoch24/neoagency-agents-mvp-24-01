import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId,
          isReprocessing // Pass the flag to the edge function
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