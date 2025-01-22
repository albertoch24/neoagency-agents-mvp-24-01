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
  if (!currentStageProcessed) {
    return (
      <p className="text-yellow-500">
        Complete the current stage before proceeding
      </p>
    );
  }

  if (!previousStageProcessed && !isFirstStage) {
    return (
      <p className="text-yellow-500">
        Previous stage must be completed before proceeding
      </p>
    );
  }

  return (
    <p className="text-green-500">
      {isFirstStage ? "Ready to proceed to next stage" : "All requirements met, ready to proceed"}
    </p>
  );
};