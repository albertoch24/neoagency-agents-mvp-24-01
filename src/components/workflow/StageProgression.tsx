import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        console.log("Current stage index:", currentIndex, "Current stage:", currentStage);
        
        // Get conversations for current stage
        const { data: currentConversations, error: currentError } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage_id", currentStage);

        if (currentError) {
          console.error("Error fetching current stage conversations:", currentError);
          return;
        }

        console.log("Current stage conversations:", currentConversations?.length);

        // If we have conversations for the current stage
        if (currentConversations?.length > 0) {
          // Get the next stage if it exists
          const nextStage = stages[currentIndex + 1];
          
          if (nextStage) {
            console.log("Checking next stage:", nextStage.id);
            
            // Check if we already have conversations for the next stage
            const { data: nextStageConversations, error: nextError } = await supabase
              .from("workflow_conversations")
              .select("*")
              .eq("brief_id", briefId)
              .eq("stage_id", nextStage.id);

            if (nextError) {
              console.error("Error checking next stage:", nextError);
              return;
            }

            // If no conversations exist for next stage, it's ready for progression
            if (!nextStageConversations?.length) {
              console.log("Stage completed, ready for progression to:", {
                fromStage: currentStage,
                toStage: nextStage.id,
                currentConversationsCount: currentConversations.length
              });
            }
          }
        }
      } catch (error) {
        console.error("Error in progression check:", error);
      }
    };

    checkAndProgressStage();
  }, [briefId, currentStage, stages, isProcessing]);

  return null;
};