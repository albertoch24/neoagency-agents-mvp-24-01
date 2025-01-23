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
  
  const { currentStageProcessed, previousStageProcessed } = useStageValidation(
    nextStage?.id || currentStage,
    briefId,
    stages
  );

  console.log("🔄 WorkflowDisplayActions Render:", {
    currentStage,
    nextStageId: nextStage?.id,
    briefId,
    isFirstStage,
    currentStageProcessed,
    previousStageProcessed,
    timestamp: new Date().toISOString()
  });

  const handleNextStage = async () => {
    if (!currentStage || !nextStage) {
      console.error('❌ No current or next stage defined');
      return;
    }

    if (!isFirstStage && !previousStageProcessed) {
      console.warn('⚠️ Previous stage not processed');
      toast.error("Previous stage must be completed first");
      return;
    }

    console.log("🚀 Processing next stage:", {
      currentStage,
      nextStageId: nextStage.id,
      nextStageName: nextStage.name,
      flowSteps: nextStage.flows?.flow_steps,
      timestamp: new Date().toISOString()
    });
    
    try {
      await onNextStage(null, nextStage.id);
      if (onStageSelect) {
        onStageSelect(nextStage);
      }
      toast.success(`Processing stage: ${nextStage.name}`);
    } catch (error) {
      console.error("❌ Error processing next stage:", error);
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
        stageId={nextStage?.id || currentStage}
        isFirstStage={isFirstStage}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleNextStage}
          disabled={
            isProcessing ||
            !currentStageProcessed ||
            (!previousStageProcessed && !isFirstStage)
          }
        >
          {isProcessing ? "Processing..." : "Next Stage"}
        </Button>
      </div>
    </div>
  );
};