import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const useStageValidation = (
  currentStage: string,
  briefId?: string,
  stages?: Stage[]
) => {
  const [currentStageProcessed, setCurrentStageProcessed] = useState(false);
  const [previousStageProcessed, setPreviousStageProcessed] = useState(false);

  const checkStageStatus = async (stageId: string, briefId: string): Promise<boolean> => {
    try {
      console.log("🔍 Checking stage status:", {
        stageId,
        briefId,
        timestamp: new Date().toISOString()
      });

      if (!briefId || !stageId) {
        console.error("❌ Missing required parameters:", { briefId, stageId });
        return false;
      }

      const { data, error } = await supabase
        .from('brief_outputs')
        .select('*')
        .eq('stage_id', stageId)
        .eq('brief_id', briefId);

      if (error) {
        console.error("❌ Error checking outputs:", error);
        return false;
      }

      const hasOutput = data && data.length > 0;

      console.log("✅ Stage validation complete:", {
        stageId,
        hasOutput,
        timestamp: new Date().toISOString()
      });

      return hasOutput;
    } catch (error) {
      console.error("❌ Stage validation error:", {
        stageId,
        error,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  useEffect(() => {
    const validateStages = async () => {
      console.log("🚀 Starting stage validation with:", {
        currentStage,
        briefId,
        stagesCount: stages?.length,
        timestamp: new Date().toISOString()
      });

      if (!currentStage || !briefId || !stages?.length) {
        console.log("⚠️ Missing required data for validation");
        return;
      }

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Gestione caso stage non trovato
      if (currentIndex === -1) {
        console.error("❌ Current stage not found in stages array:", currentStage);
        return;
      }
      
      const isFirstStage = currentIndex === 0;
      
      // Check current stage completion
      const currentResult = await checkStageStatus(currentStage, briefId);
      console.log("✅ Current stage validation result:", {
        stageId: currentStage,
        hasOutput: currentResult,
        isFirstStage,
        timestamp: new Date().toISOString()
      });
      setCurrentStageProcessed(currentResult);

      // Per gli stage non-primi, verifica lo stage precedente
      if (!isFirstStage) {
        const previousStage = stages[currentIndex - 1];
        // Verifica che previousStage esista prima di accedere al suo id
        if (previousStage) {
          const previousResult = await checkStageStatus(previousStage.id, briefId);
          console.log("✅ Previous stage validation result:", {
            stageId: previousStage.id,
            hasOutput: previousResult,
            timestamp: new Date().toISOString()
          });
          setPreviousStageProcessed(previousResult);
        } else {
          console.warn("⚠️ Previous stage not found:", {
            currentIndex,
            stagesLength: stages.length
          });
          // Se non troviamo lo stage precedente, assumiamo che sia completato
          setPreviousStageProcessed(true);
        }
      } else {
        // Per il primo stage, impostiamo previousStageProcessed a true
        console.log("ℹ️ First stage detected, setting previousStageProcessed to true");
        setPreviousStageProcessed(true);
      }
    };

    validateStages();
  }, [currentStage, briefId, stages]);

  return {
    currentStageProcessed,
    previousStageProcessed
  };
};