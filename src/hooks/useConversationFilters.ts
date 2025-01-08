interface Conversation {
  id: string;
  output_type: string;
  content?: string;
  flow_step_id?: string;
  audio_url?: string;
}

export const useConversationFilters = (conversations: Conversation[] = []) => {
  const filterConversationalOutputs = (visibleTexts: Record<string, boolean>) => {
    return conversations.filter((conv) => {
      const isConversational = conv.output_type === 'conversational';
      console.log("Filtering conversation:", {
        id: conv.id,
        type: conv.output_type,
        isConversational,
        content: conv.content?.substring(0, 100),
        flowStepId: conv.flow_step_id,
        hasAudioUrl: !!conv.audio_url,
        isVisible: visibleTexts[conv.id],
        contentLength: conv.content?.length
      });
      return isConversational;
    });
  };

  return {
    filterConversationalOutputs
  };
};