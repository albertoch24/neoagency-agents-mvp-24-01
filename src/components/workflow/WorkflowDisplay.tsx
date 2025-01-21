import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { Stage } from "@/types/workflow";
import { useStagesData } from "@/hooks/useStagesData";
import { StageOutputDisplay } from "./StageOutputDisplay";

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
  const { data: stages = [] } = useStagesData(briefId);

  const handleReprocess = async (feedbackId?: string | null) => {
    console.log('🔄 WorkflowDisplay - Starting reprocess:', {
      briefId,
      currentStage,
      feedbackId: feedbackId || null,
      timestamp: new Date().toISOString()
    });

    if (briefId && currentStage) {
      await processStage(feedbackId || null);
      
      console.log('✅ WorkflowDisplay - Reprocess completed:', {
        briefId,
        currentStage,
        feedbackId: feedbackId || null,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-4">
      <WorkflowStages
        briefId={briefId}
        currentStage={currentStage || ''}
        onStageSelect={onStageSelect || (() => {})}
        stages={stages}
      />
      {currentStage && briefId && (
        <StageOutputDisplay
          briefId={briefId}
          currentStage={currentStage}
          showOutputs={showOutputs}
          onReprocess={handleReprocess}
        />
      )}
      <WorkflowDisplayActions
        currentStage={currentStage || ''}
        stages={stages}
        onNextStage={() => handleReprocess(null)}
        isProcessing={isProcessing}
        onStageSelect={onStageSelect}
      />
    </div>
  );
};