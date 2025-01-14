import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { Stage } from "@/types/workflow";

interface WorkflowDisplayProps {
  briefId?: string;
  currentStage?: string;
  onStageSelect?: (stage: Stage) => void;
  showOutputs?: boolean;
}

export const WorkflowDisplay = ({ 
  briefId, 
  currentStage,
  onStageSelect,
  showOutputs 
}: WorkflowDisplayProps) => {
  const { isProcessing, processStage } = useStageProcessing(briefId, currentStage);

  const handleReprocess = async () => {
    if (briefId && currentStage) {
      await processStage(true); // Pass true to indicate reprocessing
    }
  };

  return (
    <div className="space-y-4">
      <WorkflowStages
        briefId={briefId}
        currentStage={currentStage}
        onStageSelect={onStageSelect}
        onReprocess={handleReprocess}
        isProcessing={isProcessing}
      />
      {showOutputs && (
        <WorkflowOutput 
          briefId={briefId}
          stageId={currentStage}
        />
      )}
      <WorkflowDisplayActions
        currentStage={currentStage || ''}
        stages={[]} // We'll get stages from a query
        onNextStage={handleReprocess}
        isProcessing={isProcessing}
        onStageSelect={onStageSelect}
      />
    </div>
  );
};