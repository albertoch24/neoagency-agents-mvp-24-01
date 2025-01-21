import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStageOutput = (selectedBriefId: string | null, currentStage: string) => {
  return useQuery({
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
};