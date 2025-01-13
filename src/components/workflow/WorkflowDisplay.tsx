import { WorkflowStages } from "./WorkflowStages";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { StageOutputDisplay } from "./StageOutputDisplay";
import { StageProgression } from "./StageProgression";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkflowSession } from "./hooks/useWorkflowSession";

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
  const { handleSessionRefresh } = useWorkflowSession();

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
          if (error.message?.includes('JWT expired')) {
            console.log("JWT expired, attempting to refresh session");
            const refreshed = await handleSessionRefresh();
            if (!refreshed) return [];
            
            const { data: retryData, error: retryError } = await supabase
              .from("workflow_conversations")
              .select("stage_id")
              .eq("brief_id", briefId)
              .order("created_at", { ascending: true });

            if (retryError) {
              console.error("Error after session refresh:", retryError);
              toast.error("Failed to fetch workflow data. Please try again.");
              return [];
            }
            return retryData?.map(item => item.stage_id) || [];
          }
          
          console.error("Error fetching completed stages:", error);
          toast.error("Failed to fetch completed stages");
          return [];
        }
        
        return data?.map(item => item.stage_id) || [];
      } catch (error) {
        console.error("Error in completedStages query:", error);
        toast.error("An unexpected error occurred while fetching stages");
        return [];
      }
    },
    enabled: !!briefId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const handleNextStage = async () => {
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
      }
    } catch (error) {
      console.error("Error processing next stage:", error);
      toast.error("Failed to process next stage");
    }
  };

  const handleReprocess = async () => {
    if (!briefId || !currentStage) return;
    
    const currentStageData = stages.find(stage => stage.id === currentStage);
    if (!currentStageData) return;

    try {
      const success = await processStage(currentStageData);
      if (success) {
        toast.success("Stage reprocessed successfully");
      }
    } catch (error) {
      console.error("Error reprocessing stage:", error);
      toast.error("Failed to reprocess stage");
    }
  };

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
          <StageProgression 
            briefId={briefId}
            currentStage={currentStage}
            isProcessing={isProcessing}
            stages={stages}
          />
          
          <StageOutputDisplay
            briefId={briefId}
            currentStage={currentStage}
            showOutputs={showOutputs}
            onReprocess={handleReprocess}
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