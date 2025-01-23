import { StageData } from "./types";

export const useStageCompletion = (stageData?: StageData) => {
  if (!stageData) return false;
  
  return stageData.outputs?.length > 0 && stageData.conversations?.length > 0;
};