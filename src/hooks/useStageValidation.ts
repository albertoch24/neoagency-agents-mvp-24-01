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

        // Check both outputs and conversations
        const [outputsResponse, conversationsResponse] = await Promise.all([
          supabase
            .from('brief_outputs')
            .select('*')
            .eq('stage_id', stageId)
            .eq('brief_id', briefId),
          supabase
            .from('workflow_conversations')
            .select('*')
            .eq('stage_id', stageId)
            .eq('brief_id', briefId)
        ]);

        if (outputsResponse.error) throw outputsResponse.error;
        if (conversationsResponse.error) throw conversationsResponse.error;

        const hasOutputs = outputsResponse.data && outputsResponse.data.length > 0;
        const hasConversations = conversationsResponse.data && conversationsResponse.data.length > 0;
        
        console.log("📊 Stage status check results:", {
          stageId,
          hasOutputs,
          hasConversations,
          outputCount: outputsResponse.data?.length,
          conversationCount: conversationsResponse.data?.length,
          timestamp: new Date().toISOString()
        });

        return hasOutputs && hasConversations;
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
      if (!currentStage || !briefId || !stages?.length) return;

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage
      const currentProcessed = await checkStageStatus(currentStage, briefId);
      setCurrentStageProcessed(currentProcessed);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousProcessed = await checkStageStatus(previousStage.id, briefId);
        setPreviousStageProcessed(previousProcessed);
      } else {
        setPreviousStageProcessed(true); // First stage doesn't need previous validation
      }
    };

    validateStages();
  }, [currentStage, briefId, stages]);

  return {
    currentStageProcessed,
    previousStageProcessed
  };
};