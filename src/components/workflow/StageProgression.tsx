import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StageProgressionProps {
  briefId?: string;
  currentStage: string;
  isProcessing: boolean;
  stages: any[];
}

export const StageProgression = ({ 
  briefId, 
  currentStage, 
  isProcessing, 
  stages 
}: StageProgressionProps) => {
  useEffect(() => {
    if (!briefId || !currentStage || isProcessing || !stages.length) {
      return;
    }

    const checkAndProgressStage = async () => {
      try {
        const currentIndex = stages.findIndex(stage => stage.id === currentStage);
        console.log("🔍 Checking progression for:", {
          currentIndex,
          currentStage,
          totalStages: stages.length,
          timestamp: new Date().toISOString()
        });

        // Se è il primo stage, verifichiamo solo gli output correnti
        if (currentIndex === 0) {
          const { data: currentOutputs, error: outputError } = await supabase
            .from("brief_outputs")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", currentStage);

          if (outputError) {
            console.error("Error checking current stage outputs:", outputError);
            return;
          }

          console.log("📊 First stage outputs:", {
            count: currentOutputs?.length,
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });

          // Per il primo stage, consideriamo solo gli output come criterio di completamento
          if (currentOutputs?.length > 0) {
            console.log("✅ First stage ready for progression");
            const nextStage = stages[currentIndex + 1];
            if (nextStage) {
              console.log("🚀 Ready to progress to:", nextStage.id);
            }
            return;
          }
        } else {
          // Per gli altri stage, verifichiamo il completamento dello stage precedente
          const previousStage = stages[currentIndex - 1];
          
          if (!previousStage) {
            console.error("Previous stage not found");
            return;
          }

          console.log("🔍 Checking previous stage:", {
            previousStageId: previousStage.id,
            currentStage,
            timestamp: new Date().toISOString()
          });

          // Verifica output dello stage precedente
          const { data: previousOutputs, error: prevOutputError } = await supabase
            .from("brief_outputs")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", previousStage.id);

          if (prevOutputError) {
            console.error("Error checking previous stage outputs:", prevOutputError);
            return;
          }

          const isPreviousStageComplete = previousOutputs?.length > 0;

          console.log("📊 Previous stage status:", {
            stageId: previousStage.id,
            hasOutputs: previousOutputs?.length > 0,
            isComplete: isPreviousStageComplete,
            timestamp: new Date().toISOString()
          });

          if (!isPreviousStageComplete) {
            console.log("⚠️ Previous stage not complete");
            toast.error("Previous stage must be completed first");
            return;
          }

          // Se lo stage precedente è completo, verifichiamo se possiamo procedere
          const { data: currentOutputs, error: currentError } = await supabase
            .from("brief_outputs")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", currentStage);

          if (currentError) {
            console.error("Error checking current stage:", currentError);
            return;
          }

          console.log("📊 Current stage status:", {
            stageId: currentStage,
            outputsCount: currentOutputs?.length,
            timestamp: new Date().toISOString()
          });

          // Se non ci sono output per lo stage corrente, possiamo procedere
          if (!currentOutputs?.length) {
            const nextStage = stages[currentIndex + 1];
            if (nextStage) {
              console.log("✅ Ready to progress to:", nextStage.id);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error in progression check:", error);
        toast.error("Error checking stage progression");
      }
    };

    checkAndProgressStage();
  }, [briefId, currentStage, stages, isProcessing]);

  return null;
};