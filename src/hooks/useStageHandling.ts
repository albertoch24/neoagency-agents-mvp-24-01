import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { resolveStageId } from "@/services/stage/resolveStageId";
import { useState, useCallback } from "react";

interface StageHandlingResult {
  data?: Stage;
  isLoading: boolean;
  error: Error | null;
  currentStage: string;
  handleStageSelect: (stage: Stage) => void;
}

export const useStageHandling = (initialStageId: string): StageHandlingResult => {
  const [currentStage, setCurrentStage] = useState<string>(initialStageId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stage", currentStage],
    queryFn: async () => {
      if (!currentStage) return null;

      console.log('🔍 Fetching stage data:', {
        stageId: currentStage,
        timestamp: new Date().toISOString()
      });

      try {
        const resolvedStageId = await resolveStageId(currentStage);
        
        const { data: stage, error } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (*)
            )
          `)
          .eq("id", resolvedStageId)
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching stage data:", {
            error,
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });
          throw error;
        }

        if (!stage) {
          console.error("❌ Stage not found:", {
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });
          throw new Error("Stage not found");
        }

        console.log("✅ Stage data retrieved:", {
          stageName: stage.name,
          hasFlow: !!stage.flows,
          flowStepsCount: stage.flows?.flow_steps?.length || 0,
          timestamp: new Date().toISOString()
        });

        return stage as Stage;
      } catch (error) {
        console.error("❌ Error fetching stage data:", {
          error,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: !!currentStage
  });

  const handleStageSelect = useCallback((stage: Stage) => {
    setCurrentStage(stage.id);
  }, []);

  return {
    data,
    isLoading,
    error: error as Error | null,
    currentStage,
    handleStageSelect
  };
};