import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { WorkflowProcessing } from "./WorkflowProcessing";
import { useStagesData } from "@/hooks/useStagesData";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useQuery } from "@tanstack/react-query";
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

  const { data: currentOutputs } = useQuery({
    queryKey: ["stage-outputs", briefId, currentStage],
    queryFn: async () => {
      if (!briefId) return null;
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("content")
        .eq("brief_id", briefId)
        .eq("stage", currentStage)
        .order("created_at", { ascending: true })
        .single();

      if (error) {
        console.error("Error fetching outputs:", error);
        return null;
      }

      return data?.content?.outputs || null;
    },
    enabled: !!briefId && !!currentStage
  });

  const handleNextStage = async () => {
    if (!briefId) return;

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;

    await processStage(nextStage);
    onStageSelect(nextStage);
  };

  if (!stages.length) {
    return (
      <div className="text-center text-muted-foreground">
        Nessuno stage trovato. Per favore, crea prima gli stage.
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
          <WorkflowProcessing 
            isProcessing={isProcessing}
            currentStage={currentStage}
            outputs={currentOutputs}
          />
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