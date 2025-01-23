import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";
import { validateBrief } from "@/utils/briefValidation";

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

        // First validate the brief exists
        const briefValidation = await validateBrief(briefId);
        if (!briefValidation.isValid) {
          console.error("❌ Brief validation failed:", briefValidation.error);
          toast.error(`Error validating brief: ${briefValidation.error}`);
          return false;
        }

        // Then check for outputs
        const { data: outputs, error: outputsError } = await supabase
          .from('brief_outputs')
          .select('content')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .maybeSingle();

        if (outputsError) {
          console.error("❌ Error checking brief_outputs:", outputsError);
          throw outputsError;
        }

        console.log("📊 Brief outputs query result:", {
          briefId,
          hasOutputs: !!outputs,
          contentType: outputs?.content ? typeof outputs.content : 'undefined',
          timestamp: new Date().toISOString()
        });

        // Validate content based on its type
        let hasValidContent = false;
        if (outputs?.content) {
          if (typeof outputs.content === 'object') {
            hasValidContent = Object.keys(outputs.content).length > 0;
          } else if (typeof outputs.content === 'string') {
            hasValidContent = outputs.content.toString().length > 0;
          } else if (typeof outputs.content === 'number') {
            hasValidContent = outputs.content !== 0;
          }
        }

        console.log("🔎 Content validation:", {
          hasValidContent,
          contentType: typeof outputs?.content,
          isContentEmpty: !hasValidContent,
          timestamp: new Date().toISOString()
        });

        return hasValidContent;
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