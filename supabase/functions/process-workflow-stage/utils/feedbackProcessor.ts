import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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

    console.log('✅ Retrieved original data for reprocessing:', {
      conversationsCount: originalConversations?.length || 0,
      outputsCount: originalOutputs?.length || 0
    });

    // Update feedback processing status
    const startTime = new Date();
    const { error: statusError } = await supabase
      .from('feedback_processing_status')
      .insert({
        feedback_id: feedbackId,
        brief_id: briefId,
        stage_id: stageId,
        feedback_content: feedbackData.content,
        is_permanent: feedbackData.is_permanent,
        requires_revision: feedbackData.requires_revision,
        update_status: 'processing'
      });

    if (statusError) {
      console.error('❌ Error updating feedback status:', statusError);
    }

    // Update feedback status if permanent
    if (feedbackData.is_permanent) {
      const { error: updateError } = await supabase
        .from('stage_feedback')
        .update({ processed_for_rag: true })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('❌ Error updating feedback RAG status:', updateError);
      }
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

    // Calculate processing time
    const endTime = new Date();
    const processingTimeSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Update processing status with results
    const { error: finalStatusError } = await supabase
      .from('feedback_processing_status')
      .update({
        update_status: 'completed',
        processing_time_seconds: processingTimeSeconds,
        conversation_updates: originalConversations?.length || 0,
        output_updates: originalOutputs?.length || 0,
        last_conversation_update: new Date().toISOString(),
        last_output_update: new Date().toISOString()
      })
      .eq('feedback_id', feedbackId);

    if (finalStatusError) {
      console.error('❌ Error updating final processing status:', finalStatusError);
    }

    console.log('✅ Feedback processing completed:', {
      feedbackId,
      processingTimeSeconds,
      conversationsUpdated: originalConversations?.length || 0,
      outputsUpdated: originalOutputs?.length || 0
    });

    return {
      feedbackContent: feedbackData.content,
      isReprocessing: true,
      isPermanent: feedbackData.is_permanent,
      originalConversationId: originalConversations?.[0]?.id
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