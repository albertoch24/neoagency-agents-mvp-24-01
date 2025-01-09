import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowContent } from "./WorkflowContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
  showOutputs?: boolean;
}

export const WorkflowDisplay = ({ 
  currentStage,
  onStageSelect,
  briefId,
  showOutputs = true
}: WorkflowDisplayProps) => {
  const { isProcessing, processStage } = useStageProcessing(briefId || "");
  const queryClient = useQueryClient();

  const handleNextStage = useCallback(async () => {
    if (!briefId) return;

    try {
      const { data: stages } = await supabase
        .from("stages")
        .select("*")
        .order("order_index", { ascending: true });

      if (!stages?.length) return;

      const currentIndex = stages.findIndex(stage => stage.id === currentStage);
      if (currentIndex === -1 || currentIndex === stages.length - 1) return;

      const nextStage = stages[currentIndex + 1];
      if (!nextStage) return;

      console.log("Processing next stage:", nextStage.id);
      const success = await processStage(nextStage);
      
      if (success) {
        console.log("Stage processed successfully, selecting next stage:", nextStage.id);
        onStageSelect(nextStage);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
        await queryClient.invalidateQueries({ queryKey: ["stage-flow-steps"] });
      }
    } catch (error) {
      console.error("Error processing next stage:", error);
      toast.error("Failed to process next stage");
    }
  }, [briefId, currentStage, processStage, onStageSelect, queryClient]);

  return (
    <WorkflowContent
      currentStage={currentStage}
      onStageSelect={onStageSelect}
      briefId={briefId}
      showOutputs={showOutputs}
      isProcessing={isProcessing}
      handleNextStage={handleNextStage}
    />
  );
};