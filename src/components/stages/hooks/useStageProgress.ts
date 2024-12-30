import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStageProgress = () => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const startStage = async (stageId: string) => {
    try {
      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { stageId },
      });

      if (error) throw error;

      setCurrentStage(stageId);
      toast.success("Stage started successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stages"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
    } catch (error) {
      console.error("Error starting stage:", error);
      toast.error("Failed to start stage");
    }
  };

  const isStageCompleted = (stageId: string) => {
    // For now, we'll consider a stage completed if it has outputs
    // This can be enhanced based on your specific completion criteria
    const outputs = queryClient.getQueryData(["brief-outputs", stageId]);
    return !!outputs;
  };

  return {
    currentStage,
    startStage,
    isStageCompleted,
  };
};