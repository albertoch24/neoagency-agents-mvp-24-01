import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        const nextStage = stages[currentIndex + 1];
        
        console.log("🔍 Checking progression for:", {
          currentIndex,
          currentStage,
          nextStageId: nextStage?.id,
          totalStages: stages.length,
          timestamp: new Date().toISOString()
        });

        // Check outputs and conversations of current stage
        const [outputsResponse, conversationsResponse] = await Promise.all([
          supabase
            .from("brief_outputs")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", currentStage),
          supabase
            .from("workflow_conversations")
            .select("*")
            .eq("brief_id", briefId)
            .eq("stage_id", currentStage)
        ]);

        if (outputsResponse.error) {
          console.error("Error checking current stage outputs:", outputsResponse.error);
          return;
        }

        if (conversationsResponse.error) {
          console.error("Error checking current stage conversations:", conversationsResponse.error);
          return;
        }

        const isCurrentStageComplete = outputsResponse.data?.length > 0 && 
                                     conversationsResponse.data?.length > 0;

        console.log("📊 Current stage status:", {
          stageId: currentStage,
          hasOutputs: outputsResponse.data?.length > 0,
          hasConversations: conversationsResponse.data?.length > 0,
          isComplete: isCurrentStageComplete,
          timestamp: new Date().toISOString()
        });

        if (!isCurrentStageComplete) {
          console.log("⚠️ Current stage not complete");
          return;
        }

        // If current stage is complete and there's a next stage, we can proceed
        if (nextStage) {
          console.log("✅ Ready to progress to:", nextStage.id, {
            currentStageComplete: isCurrentStageComplete,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("❌ Error in progression check:", error);
        toast.error("Error checking stage progression");
      }
    };

    checkAndProgressStage();
  }, [briefId, currentStage, stages, isProcessing]);

  return null;
};