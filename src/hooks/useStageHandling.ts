import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useStageProcessing } from "@/hooks/useStageProcessing";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useStageHandling = (selectedBriefId: string | null) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState("kickoff");
  const { processStage, isProcessing } = useStageProcessing(selectedBriefId || "");
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
    gcTime: 0,
    refetchInterval: 5000
  });

  // Initialize state from URL parameters and handle stage completion
  useEffect(() => {
    const stageFromUrl = searchParams.get("stage");
    if (stageFromUrl) {
      console.log("Setting stage from URL:", stageFromUrl);
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

  const handleStageSelect = async (stage: Stage) => {
    if (!selectedBriefId) return;

    console.log("Handling stage selection:", stage.id);

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
      const success = await processStage(stage);
      if (success) {
        // Invalidate queries to refresh the data
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
        
        // Show success message and automatically transition to the processed stage
        toast.success(`${stage.name} stage processed successfully!`);
        setCurrentStage(stage.id);
        
        // Update URL parameters to show outputs
        const newParams = new URLSearchParams(searchParams);
        newParams.set("stage", stage.id);
        newParams.set("showOutputs", "true");
        if (selectedBriefId) {
          newParams.set("briefId", selectedBriefId);
        }
        setSearchParams(newParams);
      }
    } else {
      // If stage already has outputs or is a previous stage, just switch to it
      setCurrentStage(stage.id);
      
      // Update URL parameters
      const newParams = new URLSearchParams(searchParams);
      newParams.set("stage", stage.id);
      newParams.set("showOutputs", "true");
      if (selectedBriefId) {
        newParams.set("briefId", selectedBriefId);
      }
      setSearchParams(newParams);
    }
  };

  return {
    currentStage,
    setCurrentStage,
    handleStageSelect,
    stageOutputs,
    isProcessing
  };
};
