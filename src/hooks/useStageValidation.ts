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

  useEffect(() => {
    const checkStageStatus = async (stageId: string, briefId: string) => {
      try {
        console.log("🔍 Starting stage status check:", {
          stageId,
          briefId,
          timestamp: new Date().toISOString()
        });

        // Check brief_outputs first as it's the primary indicator of completion
        const { data: outputs, error: outputsError } = await supabase
          .from('brief_outputs')
          .select('content, stage_id, brief_id')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .maybeSingle();

        if (outputsError) {
          console.error("❌ Error checking outputs:", {
            error: outputsError,
            stageId,
            briefId
          });
          throw outputsError;
        }

        console.log("📊 Brief outputs query result:", {
          hasOutputs: !!outputs,
          outputContent: outputs?.content ? 'Content exists' : 'No content',
          stageId: outputs?.stage_id,
          briefId: outputs?.brief_id,
          timestamp: new Date().toISOString()
        });

        // If we have content in brief_outputs, the stage is considered complete
        const isComplete = !!outputs?.content;

        console.log("✅ Stage completion status:", {
          stageId,
          briefId,
          isComplete,
          hasContent: !!outputs?.content,
          timestamp: new Date().toISOString()
        });

        return isComplete;

      } catch (error) {
        console.error("❌ Error in checkStageStatus:", {
          error,
          stageId,
          briefId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        toast.error("Error checking stage status");
        return false;
      }
    };

    const validateStages = async () => {
      if (!currentStage || !briefId || !stages?.length) {
        console.log("⚠️ Missing required data for validation:", {
          hasCurrentStage: !!currentStage,
          hasBriefId: !!briefId,
          hasStages: !!stages?.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log("🔄 Starting stages validation:", {
        currentStage,
        briefId,
        stagesCount: stages.length,
        timestamp: new Date().toISOString()
      });

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage
      const currentProcessed = await checkStageStatus(currentStage, briefId);
      console.log("📌 Current stage processed:", {
        currentStage,
        currentProcessed,
        timestamp: new Date().toISOString()
      });
      setCurrentStageProcessed(currentProcessed);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousProcessed = await checkStageStatus(previousStage.id, briefId);
        console.log("📌 Previous stage processed:", {
          previousStageId: previousStage.id,
          previousProcessed,
          timestamp: new Date().toISOString()
        });
        setPreviousStageProcessed(previousProcessed);
      } else {
        // First stage doesn't need previous validation
        console.log("ℹ️ First stage - no previous validation needed");
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