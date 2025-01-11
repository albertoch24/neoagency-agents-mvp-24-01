import { Card, CardContent } from "@/components/ui/card";
import { StageNavigationButton } from "./StageNavigationButton";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

interface StageNavigationProps {
  currentStage: string;
  stages: any[];
  onNextStage: () => void;
  isProcessing: boolean;
  onStageSelect?: (stage: any) => void;
  nextStageHasOutput: boolean;
}

export const StageNavigation = ({
  currentStage,
  stages,
  onNextStage,
  isProcessing,
  onStageSelect,
  nextStageHasOutput,
}: StageNavigationProps) => {
  const location = useLocation();
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const isFirstStage = currentIndex === 0;

  const handleNextStage = () => {
    if (isLastStage) {
      toast.error("This is the last stage");
      return;
    }

    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;

    if (nextStageHasOutput) {
      if (onStageSelect) {
        console.log("Navigating to next stage:", nextStage.id);
        onStageSelect(nextStage);
      }
    } else {
      console.log("Starting process for next stage:", nextStage.id);
      onNextStage();
    }
  };

  const handlePreviousStage = () => {
    if (isFirstStage) {
      toast.error("This is the first stage");
      return;
    }
    const previousStage = stages[currentIndex - 1];
    if (previousStage && onStageSelect) {
      console.log("Navigating to previous stage:", previousStage.id);
      onStageSelect(previousStage);
    }
  };

  // Non mostrare nulla se siamo nella home page senza brief selezionato
  if (location.pathname === '/' && !location.search.includes('briefId')) return null;

  // Non mostrare nulla se è l'ultimo stage
  if (isLastStage) return null;

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardContent className="flex justify-between items-center p-4">
        {!isFirstStage && location.pathname.includes('brief/') && (
          <StageNavigationButton
            direction="previous"
            onClick={handlePreviousStage}
            disabled={isProcessing}
            label="Previous Stage"
          />
        )}
        <StageNavigationButton
          direction="next"
          onClick={handleNextStage}
          disabled={isProcessing}
          label={
            isProcessing
              ? "Processing next stage... Please wait"
              : nextStageHasOutput
              ? "Next Stage"
              : "Start Stage Processing"
          }
          className="ml-auto"
        />
      </CardContent>
    </Card>
  );
};