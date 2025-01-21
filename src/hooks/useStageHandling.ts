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
  const { processStage, isProcessing } = useStageProcessing(selectedBriefId || "", currentStage);
  const queryClient = useQueryClient();

  // Query to check if stage has outputs
  const { data: stageOutputs } = useQuery({
    queryKey: ["workflow-conversations", selectedBriefId, currentStage],
    queryFn: async () => {
      if (!selectedBriefId) return null;
      
      console.log("🔍 Checking conversations for stage:", {
        stageId: currentStage,
        briefId: selectedBriefId,
        timestamp: new Date().toISOString()
      });

      // First check if the stage exists and has a valid flow
      const { data: stageData, error: stageError } = await supabase
        .from("stages")
        .select(`
          *,
          flows (
            id,
            name,
            flow_steps (*)
          )
        `)
        .eq("id", currentStage)
        .single();

      if (stageError) {
        console.error("❌ Error fetching stage data:", {
          error: stageError,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      console.log("📋 Stage data:", {
        stageName: stageData.name,
        hasFlow: !!stageData.flows,
        flowStepsCount: stageData.flows?.flow_steps?.length,
        timestamp: new Date().toISOString()
      });

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
        console.error("❌ Error fetching conversations:", {
          error,
          stageId: currentStage,
          briefId: selectedBriefId,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      console.log("✅ Found conversations:", {
        count: data?.length,
        stageId: currentStage,
        briefId: selectedBriefId,
        timestamp: new Date().toISOString()
      });
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
      console.log("🔄 Stage transition from URL:", {
        previousStage: currentStage,
        newStage: stageFromUrl,
        timestamp: new Date().toISOString()
      });
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

    // Check if stage already has outputs
    const { data: existingOutputs } = await supabase
      .from("workflow_conversations")
      .select("*")
      .eq("brief_id", selectedBriefId)
      .eq("stage_id", stage.id);

    console.log("🔍 Stage output check:", {
      stageId: stage.id,
      stageName: stage.name,
      hasExistingOutputs: !!existingOutputs?.length,
      outputCount: existingOutputs?.length,
      timestamp: new Date().toISOString()
    });

    // Only process if moving to the next stage AND no outputs exist
    if (selectedIndex === currentIndex + 1 && (!existingOutputs || existingOutputs.length === 0)) {
      // Verify the stage has a valid flow before processing
      if (!stages[selectedIndex]?.flows?.flow_steps?.length) {
        console.error("❌ Cannot process stage - no flow steps found:", {
          stageId: stage.id,
          stageName: stage.name,
          timestamp: new Date().toISOString()
        });
        toast.error("Cannot process stage - no workflow configured");
        return;
      }

      console.log("🚀 Initiating stage processing:", {
        stageId: stage.id,
        stageName: stage.name,
        briefId: selectedBriefId,
        flowStepsCount: stages[selectedIndex].flows.flow_steps.length,
        timestamp: new Date().toISOString()
      });

      await processStage(null);
      
      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
      
      console.log("✅ Stage processing completed:", {
        stageId: stage.id,
        stageName: stage.name,
        briefId: selectedBriefId,
        timestamp: new Date().toISOString()
      });

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
    } else {
      console.log("↪️ Stage transition without processing:", {
        stageId: stage.id,
        stageName: stage.name,
        reason: existingOutputs?.length ? "Existing outputs found" : "Not next stage",
        timestamp: new Date().toISOString()
      });

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