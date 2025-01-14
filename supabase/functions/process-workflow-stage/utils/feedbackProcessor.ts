import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function processFeedback(
  supabase: any,
  briefId: string,
  stageId: string,
  agentId: string,
  feedbackId: string | null
) {
  if (!feedbackId) {
    console.log('No feedback ID provided, skipping feedback processing');
    return null;
  }

  try {
    console.log('🔄 Processing feedback:', {
      briefId,
      stageId,
      agentId,
      feedbackId,
      timestamp: new Date().toISOString()
    });

    // Get feedback data
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('stage_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (feedbackError) {
      console.error('❌ Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    if (!feedbackData) {
      console.error('❌ No feedback found for ID:', feedbackId);
      return null;
    }

    console.log('✅ Retrieved feedback data:', {
      feedbackId,
      content: feedbackData.content.substring(0, 100) + '...',
      isPermanent: feedbackData.is_permanent
    });

    // Get original conversations that need to be reprocessed
    const { data: originalConversations, error: convsError } = await supabase
      .from('workflow_conversations')
      .select('*')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .eq('agent_id', agentId)
      .is('feedback_id', null)
      .order('created_at', { ascending: true });

    if (convsError) {
      console.error('❌ Error fetching original conversations:', convsError);
      throw convsError;
    }

    // Get original outputs that need to be reprocessed
    const { data: originalOutputs, error: outputsError } = await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .is('feedback_id', null)
      .order('created_at', { ascending: true });

    if (outputsError) {
      console.error('❌ Error fetching original outputs:', outputsError);
      throw outputsError;
    }

    // Update feedback processing status
    const startTime = new Date();
    const { error: statusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'processing',
        feedback_time: startTime.toISOString()
      })
      .eq('feedback_id', feedbackId);

    if (statusError) {
      console.error('❌ Error updating feedback status:', statusError);
    }

    // Mark original conversations for reprocessing
    if (originalConversations?.length > 0) {
      const { error: updateConvsError } = await supabase
        .from('workflow_conversations')
        .update({
          reprocessing: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: feedbackId
        })
        .eq('brief_id', briefId)
        .eq('stage_id', stageId)
        .eq('agent_id', agentId)
        .is('feedback_id', null);

      if (updateConvsError) {
        console.error('❌ Error marking conversations for reprocessing:', updateConvsError);
        throw updateConvsError;
      }
    }

    // Mark original outputs for reprocessing
    if (originalOutputs?.length > 0) {
      const { error: updateOutputsError } = await supabase
        .from('brief_outputs')
        .update({
          is_reprocessed: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: feedbackId
        })
        .eq('brief_id', briefId)
        .eq('stage_id', stageId)
        .is('feedback_id', null);

      if (updateOutputsError) {
        console.error('❌ Error marking outputs for reprocessing:', updateOutputsError);
        throw updateOutputsError;
      }
    }

    console.log('✅ Feedback processing completed:', {
      feedbackId,
      conversationsUpdated: originalConversations?.length || 0,
      outputsUpdated: originalOutputs?.length || 0
    });

    // Return the processed feedback context
    return {
      feedbackContent: feedbackData.content,
      isReprocessing: true,
      isPermanent: feedbackData.is_permanent,
      originalConversationId: originalConversations?.[0]?.id,
      requiresRevision: feedbackData.requires_revision
    };

  } catch (error) {
    console.error('❌ Error in processFeedback:', error);
    
    // Update status to error
    const { error: statusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'error',
        processing_time_seconds: 0
      })
      .eq('feedback_id', feedbackId);

    if (statusError) {
      console.error('❌ Error updating error status:', statusError);
    }

    throw error;
  }
}