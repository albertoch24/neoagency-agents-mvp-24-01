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

  const handleReprocess = async (feedbackId: string | null, targetStageId?: string) => {
    console.log('🚀 WorkflowDisplay - Starting process:', {
      briefId,
      currentStage,
      targetStageId,
      stageName: stages.find(s => s.id === (targetStageId || currentStage))?.name,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (briefId && (targetStageId || currentStage)) {
      try {
        const currentStageName = stages.find(s => s.id === currentStage)?.name || 'Current stage';
        const targetStageName = stages.find(s => s.id === targetStageId)?.name;
        
        // Show initial processing message
        toast.info(
          targetStageId 
            ? `Moving from "${currentStageName}" to "${targetStageName}"...`
            : `Processing "${currentStageName}"...`, 
          {
            duration: 3000
          }
        );

        await processStage(feedbackId, targetStageId);
        
        // Show success message with more context
        toast.success(
          targetStageId
            ? `Successfully moved to "${targetStageName}"`
            : `"${currentStageName}" processed successfully`,
          {
            description: feedbackId 
              ? "Changes based on your feedback have been applied"
              : "The stage has been processed with the latest updates",
            duration: 5000
          }
        );
      } catch (error) {
        console.error('❌ Error processing stage:', {
          error,
          briefId,
          currentStage,
          targetStageId,
          timestamp: new Date().toISOString()
        });
        
        // Show detailed error message
        toast.error('Stage processing failed', {
          description: error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred while processing the stage',
          duration: 5000
        });
      }
    } else {
      console.error('❌ Missing required parameters:', { 
        briefId, 
        currentStage, 
        targetStageId,
        timestamp: new Date().toISOString()
      });
      
      // Show missing parameters error
      toast.error('Missing required information', {
        description: 'Could not process the stage due to missing brief or stage information',
        duration: 5000
      });
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
        onNextStage={handleReprocess}
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