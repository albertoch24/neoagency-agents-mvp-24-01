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

  // Se lo stage è processato, mostra il messaggio di successo
  if (currentStageProcessed) {
    return (
      <p className="text-green-500">
        {isFirstStage ? "Ready to proceed to next stage" : "All requirements met, ready to proceed"}
      </p>
    );
  }

  // Se lo stage precedente non è processato e non è il primo stage
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
      Stage in progress...
    </p>
  );
};