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
        console.log("🔍 Checking stage status:", {
          stageId,
          briefId,
          timestamp: new Date().toISOString()
        });

        // Check brief_outputs first as it's the primary indicator of completion
        const { data: outputs, error: outputsError } = await supabase
          .from('brief_outputs')
          .select('content')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .maybeSingle();

        if (outputsError) {
          console.error("Error checking outputs:", outputsError);
          throw outputsError;
        }

        // If we have content in brief_outputs, the stage is considered complete
        if (outputs?.content) {
          console.log("✅ Stage completed - Found content in brief_outputs:", {
            stageId,
            briefId,
            hasContent: true,
            timestamp: new Date().toISOString()
          });
          return true;
        }

        // Fallback check for workflow_conversations if no brief_outputs found
        const { data: conversations, error: convsError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId);

        if (convsError) {
          console.error("Error checking conversations:", convsError);
          throw convsError;
        }

        const hasConversations = conversations && conversations.length > 0;
        
        console.log("📊 Stage status check results:", {
          stageId,
          hasConversations,
          conversationCount: conversations?.length,
          timestamp: new Date().toISOString()
        });

        return hasConversations;
      } catch (error) {
        console.error("❌ Error checking stage status:", {
          error,
          stageId,
          briefId,
          timestamp: new Date().toISOString()
        });
        toast.error("Error checking stage status");
        return false;
      }
    };

    const validateStages = async () => {
      if (!currentStage || !briefId || !stages?.length) {
        console.log("Missing required data for validation:", {
          hasCurrentStage: !!currentStage,
          hasBriefId: !!briefId,
          hasStages: !!stages?.length
        });
        return;
      }

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage
      const currentProcessed = await checkStageStatus(currentStage, briefId);
      console.log("Current stage processed:", currentProcessed);
      setCurrentStageProcessed(currentProcessed);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousProcessed = await checkStageStatus(previousStage.id, briefId);
        console.log("Previous stage processed:", previousProcessed);
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