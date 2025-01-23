import { useStageState } from '@/hooks/useStageState';

interface StageValidationStatusProps {
  briefId?: string;
  stageId: string;
  isFirstStage: boolean;
}

export const StageValidationStatus = ({
  briefId,
  stageId,
  isFirstStage
}: StageValidationStatusProps) => {
  const {
    isLoading,
    isProcessing,
    isCompleted,
    hasError
  } = useStageState(briefId, stageId);

  console.log('🎯 StageValidationStatus rendering:', {
    briefId,
    stageId,
    isFirstStage,
    isLoading,
    isProcessing,
    isCompleted,
    hasError,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    return (
      <p className="text-gray-500">
        Checking stage status...
      </p>
    );
  }

  if (hasError) {
    return (
      <p className="text-red-500">
        Error checking stage status
      </p>
    );
  }

  if (isCompleted) {
    return (
      <p className="text-green-500">
        {isFirstStage ? "Ready to proceed to next stage" : "All requirements met, ready to proceed"}
      </p>
    );
  }

  if (isProcessing) {
    return (
      <p className="text-yellow-500">
        Stage processing in progress...
      </p>
    );
  }

  return (
    <p className="text-yellow-500">
      Stage in progress...
    </p>
  );
};