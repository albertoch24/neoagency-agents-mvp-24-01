import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
}

export const WorkflowDisplay = ({
  currentStage,
  onStageSelect,
  briefId
}: WorkflowDisplayProps) => {
  const { data: stages = [] } = useStagesData(briefId);
  const { isProcessing, processStage } = useStageProcessing(briefId || "");
  const queryClient = useQueryClient();

  const handleNextStage = async () => {
    if (!briefId) return;

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
  };

  // Effect to handle automatic progression ONLY for the first stage
  useEffect(() => {
    const checkAndProgressFirstStage = async () => {
      if (!briefId || !currentStage || isProcessing) {
        console.log("Skipping progression check:", { briefId, currentStage, isProcessing });
        return;
      }

      try {
        // Get current stage index
        const currentIndex = stages.findIndex(stage => stage.id === currentStage);
        
        // Only proceed if this is the first stage
        if (currentIndex !== 0) {
          console.log("Not first stage, skipping automatic progression");
          return;
        }

        console.log("Checking conversations for first stage:", currentStage);
        const { data: conversations, error } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage_id", currentStage);

        if (error) {
          console.error("Error fetching conversations:", error);
          return;
        }

        // If we have no conversations for the first stage, process it
        if (!conversations || conversations.length === 0) {
          console.log("No conversations found for first stage, processing...");
          const firstStage = stages[0];
          if (firstStage) {
            const success = await processStage(firstStage);
            if (success) {
              toast.success("First stage processed successfully!");
              // Invalidate queries to refresh data
              await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
              await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
              await queryClient.invalidateQueries({ queryKey: ["stage-flow-steps"] });
            }
          }
        }
      } catch (error) {
        console.error("Error in progression check:", error);
        toast.error("Error checking stage progression");
      }
    };

    checkAndProgressFirstStage();
  }, [currentStage, briefId, stages, isProcessing, processStage, queryClient]);

  if (!stages.length) {
    return (
      <div className="text-center text-muted-foreground">
        No stages found. Please create stages first.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkflowStages
        stages={stages}
        currentStage={currentStage}
        onStageSelect={onStageSelect}
        briefId={briefId}
      />
      {briefId && (
        <>
          <WorkflowConversation
            briefId={briefId}
            currentStage={currentStage}
          />
          <WorkflowDisplayActions
            currentStage={currentStage}
            stages={stages}
            onNextStage={handleNextStage}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
};