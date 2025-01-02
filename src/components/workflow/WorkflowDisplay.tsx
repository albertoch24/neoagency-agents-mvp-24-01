import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/table.types";

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

    const success = await processStage(nextStage);
    if (success) {
      // Automatically select the next stage after successful processing
      onStageSelect(nextStage);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
    }
  };

  // Effect to handle automatic progression after initial stage processing
  useEffect(() => {
    const checkAndProgressStage = async () => {
      if (!briefId || !currentStage || isProcessing) return;

      const conversations = await queryClient.fetchQuery<Tables<'workflow_conversations'>[]>({
        queryKey: ["workflow-conversations", briefId, currentStage],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("workflow_conversations")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", currentStage);

          if (error) throw error;
          return data || [];
        }
      });

      // If we have conversations for the current stage, try to progress to the next
      if (conversations?.length > 0) {
        const currentIndex = stages.findIndex(stage => stage.id === currentStage);
        const nextStage = stages[currentIndex + 1];
        
        if (nextStage) {
          // Check if next stage already has conversations
          const { data: nextStageConversations } = await supabase
            .from("workflow_conversations")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", nextStage.id);

          // Only process next stage if it hasn't been processed yet
          if (!nextStageConversations?.length) {
            await handleNextStage();
          }
        }
      }
    };

    checkAndProgressStage();
  }, [currentStage, briefId, stages, isProcessing]);

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