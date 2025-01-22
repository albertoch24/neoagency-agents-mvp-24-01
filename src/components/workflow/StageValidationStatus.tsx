import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StageValidationStatusProps {
  currentStageProcessed: boolean;
  previousStageProcessed: boolean;
  isFirstStage: boolean;
}

export const StageValidationStatus = ({
  currentStageProcessed,
  previousStageProcessed,
  isFirstStage
}: StageValidationStatusProps) => {
  if (!previousStageProcessed && !isFirstStage) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Previous stage must be completed first
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentStageProcessed) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Current stage must be completed first
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};