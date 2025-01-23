import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

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

      const { count, error } = await supabase
        .from('brief_outputs')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stageId)
        .eq('brief_id', briefId);

      if (error) {
        console.error("❌ Error checking outputs:", error);
        throw error;
      }

      const hasOutput = count ? count > 0 : false;

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
      
      // Check current stage completion
      const currentResult = await checkStageStatus(currentStage, briefId);
      console.log("✅ Current stage validation result:", {
        stageId: currentStage,
        hasOutput: currentResult,
        timestamp: new Date().toISOString()
      });
      setCurrentStageProcessed(currentResult);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousResult = await checkStageStatus(previousStage.id, briefId);
        console.log("✅ Previous stage validation result:", {
          stageId: previousStage.id,
          hasOutput: previousResult,
          timestamp: new Date().toISOString()
        });
        setPreviousStageProcessed(previousResult);
      } else {
        // First stage doesn't need previous validation
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