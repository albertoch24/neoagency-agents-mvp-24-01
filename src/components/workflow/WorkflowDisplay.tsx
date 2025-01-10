import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { WorkflowOutput } from "./WorkflowOutput";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StageClarificationDialog } from "./StageClarificationDialog";
import { StageFeedbackDialog } from "./StageFeedbackDialog";

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
  const { data: stages = [] } = useStagesData(briefId);
  const { isProcessing, processStage } = useStageProcessing(briefId || "");
  const queryClient = useQueryClient();
  const [showClarificationDialog, setShowClarificationDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  // Find the current stage object to get its UUID
  const currentStageData = stages.find(stage => stage.id === currentStage);

  console.log("Current stage data:", currentStageData);
  console.log("All stages:", stages);
  console.log("Current stage ID:", currentStage);

  // Query to check completed stages
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
    enabled: !!briefId
  });

  // Query to check for pending clarifications
  const { data: pendingClarifications = [] } = useQuery({
    queryKey: ["stage-clarifications", briefId, currentStage],
    queryFn: async () => {
      if (!briefId || !currentStageData?.id) return [];
      
      console.log("Checking clarifications for stage:", {
        briefId,
        stageId: currentStageData.id
      });

      const { data, error } = await supabase
        .from("stage_clarifications")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", currentStageData.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching clarifications:", error);
        throw error;
      }
      return data;
    },
    enabled: !!briefId && !!currentStageData?.id
  });

  // Effect to show clarification dialog when there are pending clarifications
  useEffect(() => {
    if (pendingClarifications.length > 0) {
      setShowClarificationDialog(true);
    }
  }, [pendingClarifications]);

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
        
        // Show feedback dialog after successful processing
        setShowFeedbackDialog(true);
      }
    } catch (error) {
      console.error("Error processing next stage:", error);
      toast.error("Failed to process next stage");
    }
  }, [briefId, currentStage, stages, processStage, onStageSelect, queryClient]);

  if (!stages.length) {
    return (
      <div className="text-center text-muted-foreground">
        No stages found for this project.
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
          {showClarificationDialog && currentStageData && (
            <StageClarificationDialog
              isOpen={showClarificationDialog}
              onClose={() => setShowClarificationDialog(false)}
              stageId={currentStageData.id}
              briefId={briefId}
            />
          )}
          {showFeedbackDialog && currentStageData && (
            <StageFeedbackDialog
              isOpen={showFeedbackDialog}
              onClose={() => setShowFeedbackDialog(false)}
              stageId={currentStageData.id}
              briefId={briefId}
            />
          )}
        </>
      )}
    </div>
  );
};