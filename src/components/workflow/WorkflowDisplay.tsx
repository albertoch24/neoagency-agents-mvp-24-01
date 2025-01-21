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

  const handleReprocess = async (feedbackId: string) => {
    console.log('🔄 WorkflowDisplay - Starting reprocess:', {
      briefId,
      currentStage,
      stageName: stages.find(s => s.id === currentStage)?.name,
      feedbackId,
      timestamp: new Date().toISOString()
    });

    if (briefId && currentStage) {
      const currentStageData = stages.find(s => s.id === currentStage);
      console.log('📋 Stage Details:', {
        stageName: currentStageData?.name,
        stageId: currentStage,
        briefId,
        hasFlow: !!currentStageData?.flow_id,
        flowId: currentStageData?.flow_id,
        timestamp: new Date().toISOString()
      });

      try {
        await processStage(feedbackId);
        console.log('✅ WorkflowDisplay - Reprocess completed:', {
          briefId,
          currentStage,
          stageName: currentStageData?.name,
          feedbackId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ WorkflowDisplay - Error during reprocess:', {
          error,
          briefId,
          currentStage,
          stageName: currentStageData?.name,
          timestamp: new Date().toISOString()
        });
      }
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
        onNextStage={() => handleReprocess("true")}
        isProcessing={isProcessing}
        onStageSelect={onStageSelect}
      />
    </div>
  );
};