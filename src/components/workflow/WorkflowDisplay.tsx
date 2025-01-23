import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { Stage } from "@/types/workflow";
import { useStagesData } from "@/hooks/useStagesData";
import { StageOutputDisplay } from "./StageOutputDisplay";
import { toast } from "sonner";

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

  console.log('🔄 WorkflowDisplay Render:', {
    briefId,
    currentStage,
    stagesCount: stages.length,
    timestamp: new Date().toISOString()
  });

  const handleReprocess = async (feedbackId: string | null) => {
    console.log('🚀 WorkflowDisplay - Starting process:', {
      briefId,
      currentStage,
      stageName: stages.find(s => s.id === currentStage)?.name,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (briefId && currentStage) {
      try {
        await processStage(feedbackId);
        toast.success('Processing started');
      } catch (error) {
        console.error('❌ Error processing stage:', error);
        toast.error('Failed to process stage');
      }
    } else {
      console.error('❌ Missing required parameters:', { briefId, currentStage });
      toast.error('Missing required information');
    }
  };

  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const isFirstStage = currentIndex === 0;

  console.log('📊 Stage Status:', {
    currentIndex,
    isFirstStage,
    currentStage,
    briefId,
    timestamp: new Date().toISOString()
  });

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
        briefId={briefId}
        currentStage={currentStage || ''}
        stages={stages}
        onNextStage={handleReprocess}
        isProcessing={isProcessing}
        onStageSelect={onStageSelect}
        isFirstStage={isFirstStage}
      />
    </div>
  );
};