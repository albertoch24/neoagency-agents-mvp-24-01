import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

export const useStageHandling = (briefId?: string) => {
  const [currentStage, setCurrentStage] = useState<string>("");

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", briefId],
    queryFn: async () => {
      console.log("🔍 Fetching stages for brief:", briefId);
      
      try {
        // First, get the current stage from the brief
        const { data: brief } = await supabase
          .from("briefs")
          .select("current_stage")
          .eq("id", briefId)
          .maybeSingle();

        if (brief?.current_stage) {
          console.log("📍 Current stage from brief:", brief.current_stage);
          setCurrentStage(brief.current_stage);
        }

        // Then fetch all stages
        const { data, error } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                description
              )
            )
          `)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("❌ Error fetching stages:", error);
          toast.error("Failed to load stages");
          throw error;
        }

        console.log("✅ Stages fetched successfully:", {
          count: data?.length || 0,
          stages: data?.map(s => ({ id: s.id, name: s.name }))
        });
        
        return data || [];
      } catch (error) {
        console.error("❌ Unexpected error in useStageHandling:", error);
        toast.error("Failed to load stages. Please try again.");
        throw error;
      }
    },
    enabled: !!briefId,
    retry: 2,
    retryDelay: 1000
  });

  const handleStageSelect = (stage: Stage) => {
    console.log("🔄 Selecting stage:", {
      id: stage.id,
      name: stage.name,
      previousStage: currentStage
    });
    setCurrentStage(stage.id);
  };

  useEffect(() => {
    if (stages.length > 0 && !currentStage) {
      const firstStage = stages[0];
      console.log("📍 Setting initial stage:", {
        id: firstStage.id,
        name: firstStage.name
      });
      setCurrentStage(firstStage.id);
    }
  }, [stages, currentStage]);

  return {
    currentStage,
    handleStageSelect
  };
};