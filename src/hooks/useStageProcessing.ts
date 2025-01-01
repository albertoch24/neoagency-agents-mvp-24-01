import { useState } from "react";
import { toast } from "sonner";
import { processWorkflowStage } from "@/services/workflowService";
import { supabase } from "@/integrations/supabase/client";

export const useStageProcessing = (briefId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processStage = async (nextStage: any) => {
    if (!briefId || !nextStage?.id) {
      console.error("Missing required data:", { briefId, nextStageId: nextStage?.id });
      toast.error("Dati mancanti per l'elaborazione dello stage");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(
      `Elaborazione stage ${nextStage.name}... Questo potrebbe richiedere qualche minuto. Stiamo analizzando il brief e generando insights. Non chiudere questa finestra.`,
      { duration: 120000 } // 2 minutes
    );

    try {
      console.log("Processing stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flows: nextStage.flows
      });

      // Fetch the flow directly from the database if not already included
      let flow = nextStage.flows;
      if (!flow) {
        console.log("Fetching flow for stage:", nextStage.id);
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
          console.error("Error fetching stage data:", stageError);
          throw new Error(`Errore nel recupero dei dati dello stage: ${stageError.message}`);
        }

        flow = stageData?.flows;
      }

      if (!flow) {
        console.error("No flow found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name
        });
        throw new Error(`Nessun flusso trovato per lo stage "${nextStage.name}"`);
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        console.error("No flow steps found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name,
          flowId: flow.id
        });
        throw new Error("Nessuno step trovato per questo stage");
      }

      console.log("Found flow steps:", {
        stageId: nextStage.id,
        flowId: flow.id,
        stepsCount: flowSteps.length,
        steps: flowSteps.map(step => ({
          id: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index
        }))
      });

      // Process the workflow stage
      await processWorkflowStage(briefId, nextStage, flowSteps);
      toast.dismiss(toastId);
      toast.success(`Stage ${nextStage.name} elaborato con successo! Puoi ora visualizzare i risultati.`, {
        duration: 8000
      });
    } catch (error) {
      console.error("Error processing stage:", error);
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