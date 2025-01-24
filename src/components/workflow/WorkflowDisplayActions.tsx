import { Button } from "@/components/ui/button";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";
import { useStageValidation } from "@/hooks/useStageValidation";
import { StageValidationStatus } from "./StageValidationStatus";

interface WorkflowDisplayActionsProps {
  stages: Stage[];
  currentStage: string;
  onNextStage: (feedbackId: string | null, targetStageId?: string) => void;
  isProcessing?: boolean;
  briefId?: string;
  onStageSelect?: (stage: Stage) => void;
  isFirstStage: boolean;
}

export const WorkflowDisplayActions = ({
  stages,
  currentStage,
  onNextStage,
  isProcessing,
  briefId,
  onStageSelect,
  isFirstStage
}: WorkflowDisplayActionsProps) => {
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const nextStage = stages[currentIndex + 1];
  
  // Only validate current stage
  const { currentStageProcessed } = useStageValidation(
    currentStage,
    briefId,
    stages
  );

  console.log("🔄 WorkflowDisplayActions Stage Transition Check:", {
    currentStage,
    currentStageName: stages.find(s => s.id === currentStage)?.name,
    nextStageId: nextStage?.id,
    nextStageName: nextStage?.name,
    briefId,
    isFirstStage,
    currentStageProcessed,
    currentIndex,
    totalStages: stages.length,
    hasNextStage: !!nextStage,
    timestamp: new Date().toISOString()
  });

  const handleNextStage = async () => {
    if (!currentStage || !nextStage) {
      console.error('❌ Stage Transition Error:', {
        error: 'No current or next stage defined',
        currentStage,
        nextStage,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!currentStageProcessed) {
      console.warn('⚠️ Stage Transition Blocked:', {
        reason: 'Current stage not processed',
        currentStage,
        currentStageName: stages.find(s => s.id === currentStage)?.name,
        timestamp: new Date().toISOString()
      });
      toast.error("Current stage must be completed first");
      return;
    }

    console.log("🚀 Stage Transition Started:", {
      fromStage: {
        id: currentStage,
        name: stages.find(s => s.id === currentStage)?.name,
        index: currentIndex
      },
      toStage: {
        id: nextStage.id,
        name: nextStage.name,
        index: currentIndex + 1
      },
      flowSteps: nextStage.flows?.flow_steps,
      briefId,
      timestamp: new Date().toISOString()
    });
    
    try {
      await onNextStage(null, nextStage.id);
      if (onStageSelect) {
        onStageSelect(nextStage);
      }
      console.log("✅ Stage Transition Completed:", {
        toStage: nextStage.name,
        timestamp: new Date().toISOString()
      });
      toast.success(`Processing stage: ${nextStage.name}`);
    } catch (error) {
      console.error("❌ Stage Transition Failed:", {
        error,
        fromStage: stages.find(s => s.id === currentStage)?.name,
        toStage: nextStage.name,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to process next stage");
    }
  };

  if (!stages?.length) return null;

  const isLastStage = currentIndex === stages.length - 1;

  if (isLastStage) return null;

  return (
    <div className="space-y-4">
      <StageValidationStatus
        briefId={briefId}
        stageId={currentStage}
        isFirstStage={isFirstStage}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleNextStage}
          disabled={isProcessing || !currentStageProcessed}
        >
          {isProcessing ? "Processing..." : "Next Stage"}
        </Button>
      </div>
    </div>
  );
};