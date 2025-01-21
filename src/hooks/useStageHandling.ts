import { Stage } from "@/types/workflow";
import { useStageTransition } from "./stage-handling/useStageTransition";
import { useStageOutput } from "./stage-handling/useStageOutput";
import { useStageProcessing } from "./stage-handling/useStageProcessing";

export const useStageHandling = (selectedBriefId: string | null) => {
  const { currentStage, handleStageSelect } = useStageTransition(selectedBriefId);
  const { data: stageOutputs } = useStageOutput(selectedBriefId, currentStage);
  const { handleReprocess, isProcessing } = useStageProcessing(selectedBriefId, currentStage);

  return {
    currentStage,
    handleStageSelect,
    stageOutputs,
    isProcessing,
    handleReprocess
  };
};