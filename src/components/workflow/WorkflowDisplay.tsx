import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Query to check completed stages - moved outside of conditional
  const { data: completedStages = [] } = useQuery({
    queryKey: ["completed-stages", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
      const { data } = await supabase
        .from("workflow_conversations")
        .select("stage_id")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
      
      return data?.map(item => item.stage_id) || [];
    },
    enabled: !!briefId
  });

  const handleNextStage = useCallback(async () => {
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
  }, [briefId, currentStage, stages, processStage, onStageSelect, queryClient]);

  // Effect for handling automatic progression of first stage
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

        console.log("Found conversations:", conversations?.length);
        
        // If we have conversations for the first stage, try to progress
        if (conversations?.length > 0) {
          const nextStage = stages[1]; // Get second stage
          
          if (nextStage) {
            console.log("Checking next stage conversations:", nextStage.id);
            // Check if next stage already has conversations
            const { data: nextStageConversations, error: nextError } = await supabase
              .from("workflow_conversations")
              .select("*")
              .eq("brief_id", briefId)
              .eq("stage_id", nextStage.id);

            if (nextError) {
              console.error("Error checking next stage:", nextError);
              return;
            }

            // Only process next stage if it hasn't been processed yet
            if (!nextStageConversations?.length) {
              console.log("First stage completed, ready for manual progression to next stage");
            }
          }
        }
      } catch (error) {
        console.error("Error in progression check:", error);
      }
    };

    checkAndProgressFirstStage();
  }, [briefId, currentStage, stages, isProcessing]);

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
            completedStages={completedStages}
          />
        </>
      )}
    </div>
  );
};