import { useStageProcessing } from "@/hooks/useStageProcessing";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowOutput } from "./WorkflowOutput";
import { WorkflowDisplayActions } from "./WorkflowDisplayActions";
import { Stage } from "@/types/workflow";
import { useStagesData } from "@/hooks/useStagesData";
import { StageOutputDisplay } from "./StageOutputDisplay";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const testProcessStage = async () => {
    const testPayload = {
      briefId: "d3bf7c2f-ad4b-449e-8b32-7898d6b5aea0",
      stageId: "1e027d16-7589-44ee-8771-e9093dca82f3",
      flowSteps: [
        {
          id: "ec9d746d-d087-4825-9848-625d5614f1c6",
          agent_id: "2f526b51-a2cc-4f41-ba2a-3a8994ca33fc",
          requirements: "Refined Creative Brief...",
          order_index: 0
        },
        {
          id: "8fa4ed05-f5c5-4fcd-a8f1-d3b701baf82a",
          agent_id: "f7a3d757-173b-4994-9f2a-19462898eb17",
          requirements: "align with deliverables and audience...",
          order_index: 1
        }
      ]
    };

    try {
      console.log('🚀 Testing process-workflow-stage with payload:', testPayload);
      
      const toastId = toast.loading('Testing workflow stage processing...', {
        duration: Infinity
      });

      const { data, error } = await supabase.functions.invoke('process-workflow-stage', {
        body: testPayload
      });

      toast.dismiss(toastId);

      if (error) {
        console.error('❌ Test failed:', error);
        toast.error('Test failed: ' + error.message);
        return;
      }

      console.log('✅ Test successful:', data);
      toast.success('Test completed successfully!');
    } catch (error) {
      console.error('❌ Error during test:', error);
      toast.error('Test error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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
        
        // Show persistent processing message
        const toastId = toast.loading(
          targetStageId 
            ? `Processing "${targetStageName}"...`
            : `Processing "${currentStageName}"...`, 
          {
            duration: Infinity, // Keep the toast until we dismiss it
            description: "This may take a few moments. Please wait while we generate the content."
          }
        );

        await processStage(feedbackId, targetStageId);
        
        // Dismiss the loading toast and show success message
        toast.dismiss(toastId);
        toast.success(
          targetStageId
            ? `Successfully processed "${targetStageName}"`
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
      <div className="flex justify-end mb-4">
        <button
          onClick={testProcessStage}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Test Process Stage
        </button>
      </div>
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