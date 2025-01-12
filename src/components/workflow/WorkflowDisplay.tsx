import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowOutput } from "./WorkflowOutput";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useEffect, useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StageNavigation } from "./stage-navigation/StageNavigation";
import { StageDialogsContainer } from "./stage-dialogs/StageDialogsContainer";
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
  const [nextStageHasOutput, setNextStageHasOutput] = useState(false);

  // Find the current stage object to get its UUID
  const currentStageData = stages.find(stage => stage.id === currentStage);
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);

  useEffect(() => {
    const checkNextStageOutput = async () => {
      if (currentIndex === stages.length - 1) return;
      
      const nextStage = stages[currentIndex + 1];
      if (!nextStage) return;

      try {
        const { data: outputsById } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage_id", nextStage.id)
          .maybeSingle();

        const { data: outputsByName } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("stage", nextStage.name)
          .maybeSingle();

        const { data: conversations } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("stage_id", nextStage.id)
          .maybeSingle();

        setNextStageHasOutput(!!(outputsById || outputsByName || conversations));
      } catch (error) {
        console.error("Error checking next stage output:", error);
      }
    };

    checkNextStageOutput();
  }, [currentStage, stages, currentIndex]);

  // Query to check completed stages
  const { data: completedStages = [] } = useQuery({
    queryKey: ["completed-stages", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
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
    },
    enabled: !!briefId
  });

  // Query to check for pending clarifications
  const { data: pendingClarifications = [] } = useQuery({
    queryKey: ["stage-clarifications", briefId, currentStageData?.id],
    queryFn: async () => {
      if (!briefId || !currentStageData?.id) return [];
      
      const { data, error } = await supabase
        .from("stage_clarifications")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", currentStageData.id)
        .eq("status", "pending");

      if (error) throw error;
      return data;
    },
    enabled: !!briefId && !!currentStageData?.id
  });

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
      const success = await processStage(nextStage);
      
      if (success) {
        onStageSelect(nextStage);
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
        await queryClient.invalidateQueries({ queryKey: ["stage-flow-steps"] });
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
          <div className="space-y-4">
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
            {currentStageData && (
              <StageFeedbackDialog
                open={true}
                onClose={() => {}}
                stageId={currentStageData.id}
                briefId={briefId}
                embedded={true}
              />
            )}
          </div>
          <StageNavigation
            currentStage={currentStage}
            stages={stages}
            onNextStage={handleNextStage}
            isProcessing={isProcessing}
            onStageSelect={onStageSelect}
            nextStageHasOutput={nextStageHasOutput}
          />
          {currentStageData && (
            <StageDialogsContainer
              showClarificationDialog={showClarificationDialog}
              showFeedbackDialog={false}
              onClarificationClose={() => setShowClarificationDialog(false)}
              onFeedbackClose={() => {}}
              stageId={currentStageData.id}
              briefId={briefId}
            />
          )}
        </>
      )}
    </div>
  );
};