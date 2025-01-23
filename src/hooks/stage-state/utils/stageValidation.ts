import { logQuery } from "./queryLogger";

export const validateStageIds = (
  stageId: string,
  outputs: any[],
  conversations: any[]
) => {
  const outputStageIds = new Set(outputs?.map(o => o.stage_id));
  const conversationStageIds = new Set(conversations?.map(c => c.stage_id));

  const isConsistent = 
    outputStageIds.size === 1 && 
    conversationStageIds.size === 1 && 
    outputStageIds.has(stageId) && 
    conversationStageIds.has(stageId);

  logQuery.info('Stage ID consistency check', {
    stageId,
    outputStageIds: Array.from(outputStageIds),
    conversationStageIds: Array.from(conversationStageIds),
    isConsistent
  });

  return isConsistent;
};