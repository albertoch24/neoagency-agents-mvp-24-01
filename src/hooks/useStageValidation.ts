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

  useEffect(() => {
    const checkCurrentStageStatus = async () => {
      if (!currentStage || !briefId) return;

      try {
        console.log("🔍 Checking current stage outputs:", {
          briefId,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });

        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', currentStage)
          .eq('brief_id', briefId);

        if (outputError) {
          console.error("Error checking brief outputs:", outputError);
          return;
        }

        const { data: conversations, error: convError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', currentStage)
          .eq('brief_id', briefId);

        if (convError) {
          console.error("Error checking workflow conversations:", convError);
          return;
        }

        const hasOutputs = outputs && outputs.length > 0;
        const hasConversations = conversations && conversations.length > 0;
        const isFullyProcessed = hasOutputs && hasConversations;
        
        setCurrentStageProcessed(isFullyProcessed);
        
        console.log("🔍 Current stage status check:", {
          stageId: currentStage,
          hasOutputs,
          hasConversations,
          isFullyProcessed,
          outputsCount: outputs?.length || 0,
          conversationsCount: conversations?.length || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Error checking stage status:", error);
      }
    };

    const checkPreviousStageStatus = async () => {
      if (!currentStage || !briefId || !stages?.length) return;

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      if (currentIndex <= 0) {
        setPreviousStageProcessed(true);
        return;
      }

      const previousStage = stages[currentIndex - 1];
      
      try {
        console.log("🔍 Checking previous stage outputs:", {
          briefId,
          previousStageId: previousStage.id,
          timestamp: new Date().toISOString()
        });

        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', previousStage.id)
          .eq('brief_id', briefId);

        if (outputError) {
          console.error("Error checking previous stage outputs:", outputError);
          return;
        }

        const { data: conversations, error: convError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', previousStage.id)
          .eq('brief_id', briefId);

        if (convError) {
          console.error("Error checking previous stage conversations:", convError);
          return;
        }

        const hasOutputs = outputs && outputs.length > 0;
        const hasConversations = conversations && conversations.length > 0;
        const isFullyProcessed = hasOutputs && hasConversations;

        setPreviousStageProcessed(isFullyProcessed);

        console.log("🔍 Previous stage status check:", {
          stageId: previousStage.id,
          hasOutputs,
          hasConversations,
          isFullyProcessed,
          outputsCount: outputs?.length || 0,
          conversationsCount: conversations?.length || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Error checking previous stage status:", error);
      }
    };

    checkCurrentStageStatus();
    checkPreviousStageStatus();
  }, [currentStage, briefId, stages]);

  return {
    currentStageProcessed,
    previousStageProcessed
  };
};