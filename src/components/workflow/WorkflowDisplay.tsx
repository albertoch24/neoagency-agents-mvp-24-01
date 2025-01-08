import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { WorkflowOutput } from "./WorkflowOutput";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  showOutputs = true // Changed default to true to ensure outputs are shown
}: WorkflowDisplayProps) => {
  const { data: stages = [] } = useStagesData(briefId);
  const { isProcessing, processStage } = useStageProcessing(briefId || "");
  const queryClient = useQueryClient();

  // Query to check completed stages - always initialized
  const { data: completedStages = [] } = useQuery({
    queryKey: ["completed-stages", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
      try {
        const { data, error } = await supabase
          .from("workflow_conversations")
          .select("stage_id")
          .eq("brief_id", briefId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching completed stages:", error);
          toast.error("Failed to fetch completed stages");
          return [];
        }
        
        return data?.map(item => item.stage_id) || [];
      } catch (error) {
        console.error("Error in completedStages query:", error);
        return [];
      }
    },
    enabled: !!briefId,
    retry: 3
  });

  const handleNextStage = useCallback(async () => {
    if (!briefId || !stages.length) return;

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;

    try {
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
  }, [briefId, currentStage, stages, processStage, onStageSelect, queryClient]);

  // Effect for handling automatic progression of first stage
  useEffect(() => {
    if (!briefId || !currentStage || isProcessing || !stages.length) {
      return;
    }

    const checkAndProgressFirstStage = async () => {
      try {
        // Get current stage index
        const currentIndex = stages.findIndex(stage => stage.id === currentStage);
        
        // Only proceed if this is the first stage
        if (currentIndex !== 0) {
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
          {showOutputs ? (
            <WorkflowOutput
              briefId={briefId}
              stageId={currentStage}
            />
          ) : (
            <WorkflowConversation
              briefId={briefId}
              currentStage={currentStage}
              showOutputs={showOutputs}
            />
          )}
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