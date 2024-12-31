import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkflowActionsProps {
  stages: any[];
  currentStage: string;
  onNextStage: () => void;
  disabled?: boolean;
}

export const WorkflowActions = ({ stages, currentStage, onNextStage, disabled }: WorkflowActionsProps) => {
  if (!stages?.length) return null;

  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentIndex === stages.length - 1;

  if (isLastStage) return null;

  return (
    <Card>
      <CardContent className="flex justify-end p-4">
        <Button 
          onClick={onNextStage}
          className="flex items-center gap-2"
          disabled={disabled}
        >
          Next Stage
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};