import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { WorkflowOutput } from "./WorkflowOutput";
import { useWorkflowStages } from "./hooks/useWorkflowStages";

interface WorkflowContentProps {
  currentStage: string;
  onStageSelect: (stage: any) => void;
  briefId?: string;
  showOutputs?: boolean;
  isProcessing: boolean;
  handleNextStage: () => void;
}

export const WorkflowContent = ({
  currentStage,
  onStageSelect,
  briefId,
  showOutputs = true,
  isProcessing,
  handleNextStage,
}: WorkflowContentProps) => {
  const { stages, rawStages } = useWorkflowStages(briefId);

  if (!rawStages.length) {
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
            stages={rawStages}
            onNextStage={handleNextStage}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
};