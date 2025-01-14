import { WorkflowOutput } from "./WorkflowOutput";
import { StageFeedback } from "./StageFeedback";
import { WorkflowConversation } from "./WorkflowConversation";

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
  if (!briefId) return null;

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