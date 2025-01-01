import { useState } from "react";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const useStageProcessing = (briefId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const processStage = async (nextStage: any) => {
    setIsProcessing(true);
    const toastId = toast.loading(
      `Elaborazione dello stage ${nextStage.name} in corso... Questo potrebbe richiedere qualche minuto. Stiamo analizzando il brief e generando gli output. Non chiudere questa finestra.`,
      { duration: 120000 }
    );

    try {
      console.log("Elaborazione stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flows: nextStage.flows
      });

      let flow = nextStage.flows;
      if (!flow) {
        console.log("Recupero flow per lo stage:", nextStage.id);
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                agents (
                  id,
                  name,
                  description,
                  skills (*)
                )
              )
            )
          `)
          .eq("id", nextStage.id)
          .single();

        if (stageError) {
          console.error("Errore nel recupero dei dati dello stage:", stageError);
          throw new Error(`Errore nel recupero dei dati dello stage: ${stageError.message}`);
        }

        flow = stageData?.flows;
      }

      if (!flow) {
        console.error("Nessun flow trovato per lo stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name
        });
        throw new Error(`Nessun flow trovato per lo stage "${nextStage.name}"`);
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        console.error("Nessun flow step trovato per lo stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name,
          flowId: flow.id
        });
        throw new Error("Nessun flow step trovato per questo stage");
      }

      console.log("Flow steps trovati:", {
        stageId: nextStage.id,
        flowId: flow.id,
        stepsCount: flowSteps.length,
        steps: flowSteps.map(step => ({
          id: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index
        }))
      });

      await processWorkflowStage(briefId, nextStage, flowSteps);
      
      // Invalidiamo le query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["stage-outputs"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      
      toast.dismiss(toastId);
      toast.success(`Stage ${nextStage.name} elaborato con successo! Puoi ora visualizzare i risultati.`, {
        duration: 8000
      });
    } catch (error) {
      console.error("Errore nell'elaborazione dello stage:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error 
          ? `Errore nell'elaborazione dello stage: ${error.message}. Riprova o contatta il supporto.`
          : "Errore nell'elaborazione dello stage. Riprova o contatta il supporto.",
        { duration: 8000 }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, processStage };
};