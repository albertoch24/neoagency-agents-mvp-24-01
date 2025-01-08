import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useStageProgress = () => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Set initial stage from URL if present
  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) {
      setCurrentStage(stage);
    }
  }, [searchParams]);

  return {
    currentStage,
    setCurrentStage
  };
};