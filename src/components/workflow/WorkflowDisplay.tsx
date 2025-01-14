import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";

interface WorkflowDisplayProps {
  briefId?: string;
  currentStage?: string;
  onStageSelect?: (stageId: string) => void;
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
          onReprocess={handleReprocess}
        />
      )}
      <WorkflowDisplayActions
        briefId={briefId}
        stageId={currentStage}
        isProcessing={isProcessing}
        onProcess={() => processStage(false)}
      />
    </div>
  );
};