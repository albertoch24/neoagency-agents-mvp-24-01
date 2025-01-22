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

  const handleReprocess = async (feedbackId: string | null) => {
    console.log('🚀 WorkflowDisplay - Starting process:', {
      briefId,
      currentStage,
      stageName: stages.find(s => s.id === currentStage)?.name,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString(),
      isProcessing,
      hasProcessStage: !!processStage,
      stagesCount: stages.length
    });

    if (briefId && currentStage) {
      const currentStageData = stages.find(s => s.id === currentStage);
      console.log('📋 Stage Details:', {
        stageName: currentStageData?.name,
        stageId: currentStage,
        briefId,
        hasFlow: !!currentStageData?.flow_id,
        flowId: currentStageData?.flow_id,
        flowSteps: currentStageData?.flows?.flow_steps?.length,
        timestamp: new Date().toISOString()
      });

      try {
        console.log('⚡ Starting stage processing:', {
          feedbackId: feedbackId || 'null',
          timestamp: new Date().toISOString()
        });
        
        await processStage(feedbackId);
        
        console.log('✅ WorkflowDisplay - Process completed:', {
          briefId,
          currentStage,
          stageName: currentStageData?.name,
          feedbackId,
          timestamp: new Date().toISOString()
        });

        toast.success(`Processing stage: ${currentStageData?.name}`);
      } catch (error) {
        console.error('❌ WorkflowDisplay - Error during processing:', {
          error,
          briefId,
          currentStage,
          stageName: currentStageData?.name,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        toast.error("Failed to process stage. Please try again.");
      }
    } else {
      console.error('❌ WorkflowDisplay - Missing required parameters:', {
        briefId,
        currentStage,
        timestamp: new Date().toISOString()
      });
      
      toast.error("Missing required information to process stage");
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
        onNextStage={handleReprocess}
        isProcessing={isProcessing}
        onStageSelect={onStageSelect}
      />
    </div>
  );
};