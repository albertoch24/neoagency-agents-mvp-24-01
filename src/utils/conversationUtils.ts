export const groupConversationsByStage = (conversations: any[] | undefined) => {
  return conversations?.reduce((acc: Record<string, any[]>, conv: any) => {
    if (!conv) {
      console.warn("⚠️ Null conversation detected");
      return acc;
    }
    
    const stageId = conv.stage_id;
    if (!acc[stageId]) {
      acc[stageId] = [];
      console.warn(`Created new stage group: ${stageId}`);
    }
    acc[stageId].push(conv);
    return acc;
  }, {});
};