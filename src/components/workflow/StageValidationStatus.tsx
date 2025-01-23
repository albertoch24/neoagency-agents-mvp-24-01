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
    hasError,
    stageData
  } = useStageState(briefId, stageId);

  console.log('🎯 StageValidationStatus rendering:', {
    briefId,
    stageId,
    isFirstStage,
    isLoading,
    isCompleted,
    hasError,
    hasOutputs: stageData?.outputs?.length > 0,
    hasConversations: stageData?.conversations?.length > 0,
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
      <Alert variant="success">
        <AlertDescription>
          {isFirstStage 
            ? "Pronto per procedere allo stage successivo" 
            : "Tutti i requisiti soddisfatti, pronto per procedere"}
        </AlertDescription>
      </Alert>
    );
  }

  // Mostra informazioni più dettagliate sullo stato corrente
  return (
    <Alert>
      <AlertDescription>
        {stageData?.outputs?.length === 0 && stageData?.conversations?.length === 0
          ? "Stage in attesa di elaborazione..."
          : stageData?.outputs?.length === 0
          ? "Elaborazione output in corso..."
          : stageData?.conversations?.length === 0
          ? "Elaborazione conversazioni in corso..."
          : "Completamento stage in corso..."}
      </AlertDescription>
    </Alert>
  );
};