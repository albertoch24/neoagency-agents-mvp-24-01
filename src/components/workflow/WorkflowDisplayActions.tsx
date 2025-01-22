import { Button } from "@/components/ui/button";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";
import { useStageValidation } from "@/hooks/useStageValidation";
import { StageValidationStatus } from "./StageValidationStatus";

interface WorkflowDisplayActionsProps {
  stages: Stage[];
  currentStage: string;
  onNextStage: (feedbackId: string | null) => void;
  isProcessing?: boolean;
  briefId?: string;
  onStageSelect?: (stage: Stage) => void;
}

export const WorkflowDisplayActions = ({
  stages,
  currentStage,
  onNextStage,
  isProcessing,
  briefId,
  onStageSelect
}: WorkflowDisplayActionsProps) => {
  const { currentStageProcessed, previousStageProcessed } = useStageValidation(
    currentStage,
    briefId,
    stages
  );

  const handleNextStage = async () => {
    if (!currentStage) return;

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    const isFirstStage = currentIndex === 0;

    // Modifica: rimuoviamo il controllo dello stage precedente per il Kick Off
    if (!isFirstStage && !previousStageProcessed) {
      toast.error("Previous stage must be completed first");
      return;
    }

    if (!currentStageProcessed) {
      toast.error("Current stage must be completed first");
      return;
    }

    if (nextStage) {
      console.log("🚀 Processing next stage:", {
        currentStage,
        nextStageId: nextStage.id,
        nextStageName: nextStage.name,
        flowSteps: nextStage.flows?.flow_steps,
        timestamp: new Date().toISOString()
      });
      
      try {
        await onNextStage(null);
        if (onStageSelect) {
          onStageSelect(nextStage);
        }
        toast.success(`Processing stage: ${nextStage.name}`);
      } catch (error) {
        console.error("Error processing next stage:", error);
        toast.error("Failed to process next stage");
      }
    }
  };

  if (!stages?.length) return null;

  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const isFirstStage = currentIndex === 0;

  if (isLastStage) return null;

  return (
    <div className="space-y-4">
      <StageValidationStatus
        currentStageProcessed={currentStageProcessed}
        previousStageProcessed={previousStageProcessed}
        isFirstStage={isFirstStage}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleNextStage}
          disabled={
            isProcessing ||
            !currentStageProcessed ||
            (!previousStageProcessed && !isFirstStage) // Modifica: permettiamo di procedere se è il primo stage
          }
        >
          {isProcessing ? "Processing..." : "Next Stage"}
        </Button>
      </div>
    </div>
  );
};