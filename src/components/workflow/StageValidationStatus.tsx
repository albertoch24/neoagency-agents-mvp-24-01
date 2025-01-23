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
  console.log("🎯 StageValidationStatus props:", {
    currentStageProcessed,
    previousStageProcessed,
    isFirstStage,
    timestamp: new Date().toISOString()
  });

  // If current stage is processed, show success message
  if (currentStageProcessed) {
    return (
      <p className="text-green-500">
        {isFirstStage ? "Ready to proceed to next stage" : "All requirements met, ready to proceed"}
      </p>
    );
  }

  // If previous stage isn't processed and it's not the first stage
  if (!previousStageProcessed && !isFirstStage) {
    return (
      <p className="text-yellow-500">
        Previous stage must be completed before proceeding
      </p>
    );
  }

  // Default case - stage in progress
  return (
    <p className="text-yellow-500">
      Stage in elaborazione
    </p>
  );
};