import { useState } from "react";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveStageId } from "@/services/stage/resolveStageId";

export const useStageTransition = (selectedBriefId: string | null) => {
  const [currentStage, setCurrentStage] = useState("kickoff");

  const handleStageSelect = async (stage: Stage) => {
    console.log("🔄 Transitioning to stage:", {
      stageName: stage.name,
      stageId: stage.id,
      timestamp: new Date().toISOString()
    });

    try {
      const resolvedStageId = await resolveStageId(stage.id);
      setCurrentStage(resolvedStageId);

      if (selectedBriefId) {
        const { error: updateError } = await supabase
          .from("briefs")
          .update({ current_stage: resolvedStageId })
          .eq("id", selectedBriefId);

        if (updateError) {
          console.error("❌ Error updating brief stage:", updateError);
          toast.error("Failed to update brief stage");
          throw updateError;
        }

        console.log("✅ Stage transition completed:", {
          briefId: selectedBriefId,
          newStageId: resolvedStageId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("❌ Stage transition failed:", error);
      toast.error("Failed to transition stage");
    }
  };

  return { currentStage, handleStageSelect };
};