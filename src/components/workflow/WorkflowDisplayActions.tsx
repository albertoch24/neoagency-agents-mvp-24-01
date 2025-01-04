import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface WorkflowDisplayActionsProps {
  currentStage: string;
  stages: any[];
  onNextStage: () => void;
  isProcessing: boolean;
  completedStages?: string[];
}

export const WorkflowDisplayActions = ({
  currentStage,
  stages,
  onNextStage,
  isProcessing,
  completedStages = []
}: WorkflowDisplayActionsProps) => {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;
  const isCurrentStageCompleted = completedStages?.includes(currentStage);

  if (isLastStage) return null;

  const handleNextStage = () => {
    if (!isCurrentStageCompleted) {
      toast.error("Please complete the current stage first");
      return;
    }
    onNextStage();
  };

  return (
    <Card>
      <CardContent className="flex justify-end p-4">
        <Button
          onClick={handleNextStage}
          disabled={isProcessing || !isCurrentStageCompleted}
          className="flex items-center gap-2"
        >
          {isProcessing ? "Processing next stage... Please wait" : "Next Stage"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};