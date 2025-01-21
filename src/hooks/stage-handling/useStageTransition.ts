import { useState } from "react";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStageTransition = (selectedBriefId: string | null) => {
  const [currentStage, setCurrentStage] = useState("kickoff");

  const handleStageSelect = async (stage: Stage) => {
    if (!selectedBriefId) return;

    console.log("🎯 Stage selection initiated:", {
      stageId: stage.id,
      stageName: stage.name,
      currentStage,
      briefId: selectedBriefId,
      timestamp: new Date().toISOString()
    });

    // Get the current stage index and selected stage index
    const { data: stages } = await supabase
      .from("stages")
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (*)
        )
      `)
      .order("order_index", { ascending: true });

    if (!stages) {
      console.error("❌ No stages found");
      return;
    }

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const selectedIndex = stages.findIndex(s => s.id === stage.id);

    console.log("📊 Stage transition analysis:", {
      currentIndex,
      selectedIndex,
      isForward: selectedIndex > currentIndex,
      currentStageHasFlow: !!stages[currentIndex]?.flows,
      selectedStageHasFlow: !!stages[selectedIndex]?.flows,
      timestamp: new Date().toISOString()
    });

    setCurrentStage(stage.id);
  };

  return {
    currentStage,
    setCurrentStage,
    handleStageSelect
  };
};