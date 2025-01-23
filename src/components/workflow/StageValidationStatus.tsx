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
  console.log("🎯 StageValidationStatus rendering:", {
    currentStageProcessed,
    previousStageProcessed,
    isFirstStage,
    timestamp: new Date().toISOString()
  });

  if (!currentStageProcessed) {
    return (
      <p className="text-yellow-500">
        Stage in elaborazione
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