import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export const useStageProgress = () => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const briefId = searchParams.get('briefId');

  const startStage = async (stageId: string) => {
    if (!briefId) {
      toast.error("No brief selected. Please select a brief first.");
      return;
    }

    if (!stageId) {
      toast.error("No stage selected. Please select a stage first.");
      return;
    }

    try {
      console.log('Starting stage with params:', { briefId, stageId });
      
      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId
        }
      });

      if (error) {
        console.error('Error starting stage:', error);
        throw error;
      }

      setCurrentStage(stageId);
      toast.success("Stage started successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stages"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs", briefId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations", briefId] });
    } catch (error) {
      console.error("Error starting stage:", error);
      toast.error("Failed to start stage");
    }
  };

  const isStageCompleted = (stageId: string) => {
    if (!briefId) return false;
    
    // Check if there are outputs for this stage
    const outputs = queryClient.getQueryData(["brief-outputs", briefId, stageId]);
    return !!outputs;
  };

  // Set initial stage from URL if present
  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) {
      setCurrentStage(stage);
    }
  }, [searchParams]);

  return {
    currentStage,
    startStage,
    isStageCompleted,
  };
};