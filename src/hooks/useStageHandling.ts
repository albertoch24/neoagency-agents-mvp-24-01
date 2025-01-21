import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

export const useStageHandling = (briefId?: string) => {
  const [currentStage, setCurrentStage] = useState<string>("kickoff");

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", briefId],
    queryFn: async () => {
      console.log("🔍 Fetching stages for brief:", briefId);
      
      const { data: brief } = await supabase
        .from("briefs")
        .select("current_stage")
        .eq("id", briefId)
        .maybeSingle();

      if (brief?.current_stage) {
        setCurrentStage(brief.current_stage);
      }

      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        console.error("❌ Error fetching stages:", error);
        toast.error("Failed to load stages");
        throw error;
      }

      console.log("✅ Stages fetched successfully:", data);
      return data || [];
    },
    enabled: !!briefId
  });

  const handleStageSelect = (stage: Stage) => {
    console.log("🔄 Selecting stage:", stage);
    setCurrentStage(stage.id);
  };

  useEffect(() => {
    if (stages.length > 0 && !currentStage) {
      setCurrentStage(stages[0].id);
    }
  }, [stages, currentStage]);

  return {
    currentStage,
    handleStageSelect
  };
};