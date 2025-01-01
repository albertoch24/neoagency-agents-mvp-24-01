import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BriefFormData } from "@/types/brief";
import { 
  cleanupExistingBriefData,
  createOrUpdateBrief,
  fetchFirstStage
} from "@/services/briefService";
import { processWorkflowStage } from "@/services/workflowService";

export const useBriefForm = (initialData?: any, onSubmitSuccess?: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: BriefFormData) => {
    if (!user) {
      toast.error("Devi essere loggato per inviare un brief");
      return;
    }

    console.log("Submitting brief with values:", values);
    console.log("Current user:", user);

    let toastId: string | number;

    try {
      setIsProcessing(true);
      const actionType = initialData ? "Aggiornamento" : "Creazione";
      toastId = toast.loading(`${actionType} del brief in corso...`, {
        duration: 5000
      });

      // Clean up existing data if updating
      if (initialData?.id) {
        await cleanupExistingBriefData(initialData.id);
      }

      // Create/update the brief
      const brief = await createOrUpdateBrief(values, user.id, initialData?.id);
      console.log("Brief created/updated successfully:", brief);

      // Get the first stage and its flow
      const stage = await fetchFirstStage(user.id);
      if (!stage) {
        toast.dismiss(toastId);
        toast.error("Nessuno stage trovato. Crea prima gli stage.", {
          duration: 8000
        });
        setIsProcessing(false);
        return;
      }

      console.log("Retrieved stage with flow:", stage);

      // Sort flow steps by order_index
      const flowSteps = stage.flows?.flow_steps || [];
      console.log("Retrieved flow steps before sorting:", flowSteps);
      flowSteps.sort((a, b) => a.order_index - b.order_index);
      console.log("Flow steps after sorting:", flowSteps);

      try {
        await processWorkflowStage(brief.id, stage, flowSteps);
        toast.dismiss(toastId);
        toast.success(
          initialData 
            ? "Brief aggiornato e workflow riavviato con successo!"
            : "Brief inviato e workflow completato con successo!",
          { duration: 5000 }
        );

        // Invalidate queries before navigation
        await queryClient.invalidateQueries({ queryKey: ["briefs"] });
        await queryClient.invalidateQueries({ queryKey: ["brief"] });
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });

        setIsProcessing(false);
        onSubmitSuccess?.();
        
        // Navigate to the index page with the stage and brief ID parameters
        navigate(`/?briefId=${brief.id}&stage=${stage.id}&showOutputs=true`, {
          replace: true
        });
      } catch (error) {
        console.error("Error starting workflow:", error);
        toast.dismiss(toastId);
        toast.error(
          "Brief salvato ma il workflow non è partito. Riprova o contatta il supporto.",
          { duration: 8000 }
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.dismiss(toastId);
      toast.error(
        "Errore nell'invio del brief. Controlla i dati e riprova.",
        { duration: 8000 }
      );
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};