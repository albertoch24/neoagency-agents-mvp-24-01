export async function saveConversation(
  supabase: any,
  briefId: string,
  stageId: string,
  agentId: string,
  content: string,
  feedbackContext: any | null
) {
  const now = new Date().toISOString();
  
  try {
    console.log('💾 Saving conversation:', {
      briefId,
      stageId,
      agentId,
      contentLength: content.length,
      hasFeedback: !!feedbackContext
    });

    const { data: savedConversation, error: convError } = await supabase
      .from('workflow_conversations')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        agent_id: agentId,
        content: content,
        output_type: 'conversational',
        feedback_id: feedbackContext?.feedbackId || null,
        original_conversation_id: feedbackContext?.originalConversationId || null,
        reprocessing: feedbackContext?.isReprocessing || false,
        reprocessed_at: feedbackContext?.isReprocessing ? now : null
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ Error saving conversation:', convError);
      throw convError;
    }

    console.log('✅ Conversation saved successfully:', {
      conversationId: savedConversation.id,
      originalConversationId: feedbackContext?.originalConversationId,
      feedbackId: feedbackContext?.feedbackId
    });

    return savedConversation;
  } catch (error) {
    console.error('❌ Error in saveConversation:', error);
    throw error;
  }
}