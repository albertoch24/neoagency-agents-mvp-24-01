import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkflowStage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useStageHandling = (selectedBriefId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState("kickoff");
  const { processStage } = useStageProcessing(selectedBriefId || "");
  const queryClient = useQueryClient();

  // Query to check if stage has outputs
  const { data: stageOutputs } = useQuery({
    queryKey: ["workflow-conversations", selectedBriefId, currentStage],
    queryFn: async () => {
      if (!selectedBriefId) return null;
      
      console.log("Fetching conversations for stage:", currentStage);
      const { data, error } = await supabase
        .from("workflow_conversations")
        .select(`
          *,
          agents (
            id,
            name,
            description,
            skills (*)
          )
        `)
        .eq("brief_id", selectedBriefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching conversations:", error);
        return null;
      }

      console.log("Found conversations:", data);
      return data;
    },
    enabled: !!selectedBriefId && !!currentStage,
    staleTime: 0,
    gcTime: 0
  });

  // Initialize state from URL parameters
  useEffect(() => {
    const stageFromUrl = searchParams.get("stage");
    if (stageFromUrl) {
      setCurrentStage(stageFromUrl);
      
      // Ensure showOutputs is maintained in URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set("stage", stageFromUrl);
      newParams.set("showOutputs", "true");
      if (selectedBriefId) {
        newParams.set("briefId", selectedBriefId);
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams.get("stage"), selectedBriefId]);

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
      .from("workflow_conversations")
      .select("*")
      .eq("brief_id", selectedBriefId)
      .eq("stage_id", stage.id);

    console.log("Checking existing outputs for stage:", stage.id, existingOutputs);

    // Only process if moving to the next stage AND no outputs exist
    if (selectedIndex === currentIndex + 1 && (!existingOutputs || existingOutputs.length === 0)) {
      await processStage(stage);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
    }

    setCurrentStage(stage.id);
    
    // Update URL parameters
    const newParams = new URLSearchParams(searchParams);
    newParams.set("stage", stage.id);
    newParams.set("showOutputs", "true");
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