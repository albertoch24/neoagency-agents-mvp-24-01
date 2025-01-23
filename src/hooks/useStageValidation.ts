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
        console.log("🔍 Checking stage status for:", {
          stageId,
          briefId,
          timestamp: new Date().toISOString()
        });

        const { data: outputs, error: outputsError } = await supabase
          .from('brief_outputs')
          .select('content, brief_id')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .maybeSingle();

        if (outputsError) {
          console.error("❌ Error checking brief_outputs:", outputsError);
          throw outputsError;
        }

        console.log("📊 Brief outputs query result:", {
          briefId,
          foundBriefId: outputs?.brief_id,
          hasOutputs: !!outputs,
          hasContent: !!outputs?.content,
          contentType: outputs?.content ? typeof outputs.content : 'undefined',
          contentValue: outputs?.content,
          timestamp: new Date().toISOString()
        });

        // Verifica più dettagliata del contenuto
        const hasValidContent = outputs?.content && (
          (typeof outputs.content === 'object' && Object.keys(outputs.content).length > 0) ||
          (typeof outputs.content === 'string' && outputs.content.length > 0)
        );

        console.log("🔎 Content validation:", {
          hasValidContent,
          contentType: typeof outputs?.content,
          isContentEmpty: outputs?.content ? 
            typeof outputs.content === 'object' ? 
              Object.keys(outputs.content).length === 0 : 
              outputs.content.length === 0 : 
            true
        });

        const isComplete = hasValidContent;

        console.log("✅ Stage completion check result:", {
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
      console.log("🚀 Starting stage validation with:", {
        currentStage,
        briefId,
        stagesCount: stages?.length,
        timestamp: new Date().toISOString()
      });

      if (!currentStage || !briefId || !stages?.length) {
        console.log("⚠️ Missing required data for validation:", {
          hasCurrentStage: !!currentStage,
          currentStage,
          hasBriefId: !!briefId,
          briefId,
          hasStages: !!stages?.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage completion
      const currentProcessed = await checkStageStatus(currentStage, briefId);
      console.log("✅ Current stage processed:", currentProcessed);
      setCurrentStageProcessed(currentProcessed);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousProcessed = await checkStageStatus(previousStage.id, briefId);
        console.log("✅ Previous stage processed:", previousProcessed);
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