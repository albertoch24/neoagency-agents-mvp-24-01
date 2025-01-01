import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkflowStage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useQuery } from "@tanstack/react-query";

export const useStageHandling = (selectedBriefId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState("kickoff");
  const { processStage } = useStageProcessing(selectedBriefId || "");

  // Query to check if stage has outputs
  const { data: stageOutputs } = useQuery({
    queryKey: ["brief-outputs", selectedBriefId, currentStage],
    queryFn: async () => {
      if (!selectedBriefId) return null;
      
      const { data } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", selectedBriefId)
        .eq("stage", currentStage)
        .single();
      
      return data;
    },
    enabled: !!selectedBriefId && !!currentStage
  });

  useEffect(() => {
    const stageFromUrl = searchParams.get("stage");
    if (stageFromUrl) {
      setCurrentStage(stageFromUrl);
    }
  }, [searchParams]);

  const handleStageSelect = async (stage: WorkflowStage) => {
    if (!selectedBriefId) return;

    // Get the current stage index and selected stage index
    const { data: stages } = await supabase
      .from("stages")
      .select("*")
      .order("order_index", { ascending: true });

    if (!stages) return;

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const selectedIndex = stages.findIndex(s => s.id === stage.id);

    // Check if stage already has outputs
    const { data: existingOutputs } = await supabase
      .from("brief_outputs")
      .select("*")
      .eq("brief_id", selectedBriefId)
      .eq("stage", stage.id)
      .maybeSingle();

    // Only process if moving to the next stage AND no outputs exist
    if (selectedIndex === currentIndex + 1 && !existingOutputs) {
      await processStage(stage);
    }

    setCurrentStage(stage.id);
    
    // Update URL with new stage while preserving briefId and showOutputs
    const newParams = new URLSearchParams(searchParams);
    newParams.set("stage", stage.id);
    if (selectedBriefId) {
      newParams.set("briefId", selectedBriefId);
    }
    setSearchParams(newParams);
  };

  return {
    currentStage,
    setCurrentStage,
    handleStageSelect,
    stageOutputs
  };
};