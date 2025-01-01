import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface WorkflowProcessingProps {
  isProcessing: boolean;
  stageName: string;
}

export const WorkflowProcessing = ({ isProcessing, stageName }: WorkflowProcessingProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  
  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      const steps = [
        "Inizializzazione processo",
        "Validazione brief e stage",
        "Elaborazione agenti",
        "Generazione output",
        "Salvataggio risultati"
      ];
      
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < steps.length) {
          setCurrentStep(steps[currentIndex]);
          setProgress((prev) => Math.min(prev + 20, 100));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
      setCurrentStep("");
    }
  }, [isProcessing]);

  if (!isProcessing && !currentStep) return null;

  return (
    <div className="space-y-4 my-8">
      <Alert variant="default" className={!isProcessing ? "border-green-500 bg-green-50" : undefined}>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <AlertTitle>
            {isProcessing 
              ? `Elaborazione ${stageName} in corso...` 
              : `Elaborazione ${stageName} completata!`}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {isProcessing ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {currentStep}
              </p>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tutti gli output sono stati generati con successo.
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};