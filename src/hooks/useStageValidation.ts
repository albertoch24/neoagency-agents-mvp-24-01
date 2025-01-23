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
        console.log("🔍 Checking stage completion for:", {
          stageId,
          briefId,
          timestamp: new Date().toISOString()
        });

        // Check brief_outputs for content
        const { data: outputs, error: outputsError } = await supabase
          .from('brief_outputs')
          .select('content, stage_id')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .maybeSingle();

        if (outputsError) {
          console.error("❌ Error checking brief_outputs:", outputsError);
          throw outputsError;
        }

        // Stage is complete if there's content in brief_outputs
        const isComplete = !!outputs?.content;

        console.log("📊 Stage completion check result:", {
          stageId,
          briefId,
          isComplete,
          hasContent: !!outputs?.content,
          timestamp: new Date().toISOString()
        });

        return isComplete;

      } catch (error) {
        console.error("❌ Stage validation error:", error);
        toast.error("Error checking stage status");
        return false;
      }
    };

    const validateStages = async () => {
      if (!currentStage || !briefId || !stages?.length) {
        console.log("⚠️ Missing validation data:", {
          currentStage,
          briefId,
          stagesCount: stages?.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage completion
      const currentProcessed = await checkStageStatus(currentStage, briefId);
      setCurrentStageProcessed(currentProcessed);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousProcessed = await checkStageStatus(previousStage.id, briefId);
        setPreviousStageProcessed(previousProcessed);
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