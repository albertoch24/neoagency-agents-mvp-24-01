import { useStageState } from '@/hooks/useStageState';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

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
    isCompleted,
    hasError
  } = useStageState(briefId, stageId);

  console.log('🎯 StageValidationStatus rendering:', {
    briefId,
    stageId,
    isFirstStage,
    isLoading,
    isCompleted,
    hasError,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando lo stato dello stage...
        </AlertDescription>
      </Alert>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore durante la verifica dello stato dello stage
        </AlertDescription>
      </Alert>
    );
  }

  if (isCompleted) {
    return (
      <Alert>
        <AlertDescription className="text-green-600">
          {isFirstStage 
            ? "Pronto per procedere allo stage successivo" 
            : "Stage precedente completato, pronto per procedere"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertDescription>
        {isFirstStage 
          ? "Stage in attesa di elaborazione..." 
          : "In attesa del completamento dello stage precedente..."}
      </AlertDescription>
    </Alert>
  );
};