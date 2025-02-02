import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const useStageProgress = () => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Set initial stage from URL if present and handle stage changes
  useEffect(() => {
    const stage = searchParams.get('stage');
    console.log('🔄 Stage from URL changed:', {
      newStage: stage,
      currentStage,
      timestamp: new Date().toISOString()
    });

    if (stage && stage !== currentStage) {
      // Invalidate queries related to the old stage
      if (currentStage) {
        queryClient.invalidateQueries({ queryKey: ['stage', currentStage] });
        queryClient.invalidateQueries({ queryKey: ['stage-state', currentStage] });
      }
      
      // Set new stage
      setCurrentStage(stage);
      
      // Prefetch new stage data
      queryClient.prefetchQuery({
        queryKey: ['stage', stage],
        queryFn: () => Promise.resolve(null) // Actual fetch will happen in useStageHandling
      });
    }
  }, [searchParams, currentStage, queryClient]);

  return {
    currentStage,
    setCurrentStage
  };
};