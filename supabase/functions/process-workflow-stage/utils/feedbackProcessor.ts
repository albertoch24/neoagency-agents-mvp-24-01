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

  const startTime = new Date();

  try {
    console.log('🔄 Starting feedback processing:', {
      briefId,
      stageId,
      agentId,
      feedbackId,
      timestamp: startTime.toISOString()
    });

    // Get feedback data with explicit field selection
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('stage_feedback')
      .select(`
        id,
        content,
        is_permanent,
        requires_revision,
        processed_for_rag
      `)
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
      contentPreview: feedbackData.content.substring(0, 100) + '...',
      isPermanent: feedbackData.is_permanent,
      requiresRevision: feedbackData.requires_revision
    });

    // Update processing status to started
    const { error: statusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'processing',
        feedback_time: startTime.toISOString()
      })
      .eq('feedback_id', feedbackId);

    if (statusError) {
      console.error('❌ Error updating processing status:', statusError);
    }

    // Get original conversations for reference
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

    // Mark conversations for reprocessing
    if (originalConversations?.length > 0) {
      const { error: updateConvsError } = await supabase
        .from('workflow_conversations')
        .update({
          reprocessing: true,
          reprocessed_at: startTime.toISOString(),
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

    // Calculate processing time
    const endTime = new Date();
    const processingTimeSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Update final status
    const { error: finalStatusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'processed',
        processing_time_seconds: processingTimeSeconds,
        conversation_updates: originalConversations?.length || 0,
        last_conversation_update: endTime.toISOString()
      })
      .eq('feedback_id', feedbackId);

    if (finalStatusError) {
      console.error('❌ Error updating final status:', finalStatusError);
    }

    console.log('✅ Feedback processing completed:', {
      feedbackId,
      processingTimeSeconds,
      conversationsUpdated: originalConversations?.length || 0
    });

    // Return complete feedback context
    return {
      feedbackContent: feedbackData.content,
      isReprocessing: true,
      isPermanent: feedbackData.is_permanent,
      requiresRevision: feedbackData.requires_revision,
      originalConversationId: originalConversations?.[0]?.id,
      processingTimeSeconds
    };

  } catch (error) {
    console.error('❌ Error in processFeedback:', error);
    
    // Update error status
    const endTime = new Date();
    const processingTimeSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    const { error: statusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'error',
        processing_time_seconds: processingTimeSeconds
      })
      .eq('feedback_id', feedbackId);

    if (statusError) {
      console.error('❌ Error updating error status:', statusError);
    }

    throw error;
  }
}