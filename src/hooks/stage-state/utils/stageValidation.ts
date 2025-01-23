export const validateStageIds = (
  stageId: string,
  outputs: any[],
  conversations: any[]
) => {
  const outputStageIds = outputs.map(o => o.stage_id);
  const conversationStageIds = conversations.map(c => c.stage_id);

  const isConsistent = outputStageIds.every(id => id === stageId) &&
                      conversationStageIds.every(id => id === stageId);

  console.log('🔄 Cache: Stage ID consistency check', {
    stageId,
    outputStageIds,
    conversationStageIds,
    isConsistent,
    timestamp: new Date().toISOString()
  });

  if (!isConsistent) {
    throw new Error('Stage ID mismatch detected');
  }
};