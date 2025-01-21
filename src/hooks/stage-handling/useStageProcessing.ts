import { useStageProcessing as useBaseStageProcessing } from "@/hooks/useStageProcessing";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useStageProcessing = (selectedBriefId: string | null, currentStage: string) => {
  const { processStage, isProcessing } = useBaseStageProcessing(selectedBriefId || "", currentStage);
  const queryClient = useQueryClient();

  const handleReprocess = async (feedbackId: string) => {
    console.log('🔄 Stage Processing - Starting reprocess:', {
      briefId: selectedBriefId,
      currentStage,
      feedbackId,
      timestamp: new Date().toISOString()
    });

    if (selectedBriefId && currentStage) {
      try {
        await processStage(feedbackId);
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
        
        toast.success("Stage reprocessed successfully!");
      } catch (error) {
        console.error('❌ Stage Processing - Error during reprocess:', {
          error,
          briefId: selectedBriefId,
          currentStage,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to reprocess stage");
      }
    }
  };

  return {
    handleReprocess,
    isProcessing
  };
};