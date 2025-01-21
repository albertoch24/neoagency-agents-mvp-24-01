import { WorkflowOutput } from "./WorkflowOutput";
import { StageFeedback } from "./StageFeedback";
import { WorkflowConversation } from "./WorkflowConversation";
import { useStagesData } from "@/hooks/useStagesData";

interface StageOutputDisplayProps {
  briefId?: string;
  currentStage: string;
  showOutputs?: boolean;
  onReprocess: (feedbackId: string) => Promise<void>;
}

export const StageOutputDisplay = ({
  briefId,
  currentStage,
  showOutputs = true,
  onReprocess
}: StageOutputDisplayProps) => {
  const { data: stages = [] } = useStagesData(briefId);
  const currentStageData = stages.find(s => s.id === currentStage);

  console.log('🔄 StageOutputDisplay - Rendering with props:', {
    briefId,
    currentStage,
    stageName: currentStageData?.name,
    showOutputs,
    hasOnReprocess: !!onReprocess,
    timestamp: new Date().toISOString()
  });

  if (!briefId) {
    console.log('⚠️ StageOutputDisplay - No briefId provided');
    return null;
  }

  return showOutputs ? (
    <>
      <WorkflowOutput
        briefId={briefId}
        stageId={currentStage}
      />
      <StageFeedback
        briefId={briefId}
        stageId={currentStage}
        onReprocess={onReprocess}
      />
    </>
  ) : (
    <WorkflowConversation
      briefId={briefId}
      currentStage={currentStage}
      showOutputs={showOutputs}
    />
  );
};