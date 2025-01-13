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

    const checkAndProgressFirstStage = async () => {
      try {
        const currentIndex = stages.findIndex(stage => stage.id === currentStage);
        
        if (currentIndex !== 0) {
          return;
        }

        console.log("Checking conversations for first stage:", currentStage);
        const { data: conversations, error } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage_id", currentStage);

        if (error) {
          console.error("Error fetching conversations:", error);
          return;
        }

        console.log("Found conversations:", conversations?.length);
        
        if (conversations?.length > 0) {
          const nextStage = stages[1];
          
          if (nextStage) {
            console.log("Checking next stage conversations:", nextStage.id);
            const { data: nextStageConversations, error: nextError } = await supabase
              .from("workflow_conversations")
              .select("*")
              .eq("brief_id", briefId)
              .eq("stage_id", nextStage.id);

            if (nextError) {
              console.error("Error checking next stage:", nextError);
              return;
            }

            if (!nextStageConversations?.length) {
              console.log("First stage completed, ready for manual progression to next stage");
            }
          }
        }
      } catch (error) {
        console.error("Error in progression check:", error);
      }
    };

    checkAndProgressFirstStage();
  }, [briefId, currentStage, stages, isProcessing]);

  return null;
};