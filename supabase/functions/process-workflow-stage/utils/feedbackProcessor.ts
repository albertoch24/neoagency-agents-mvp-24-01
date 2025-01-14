import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface FeedbackData {
  content: string;
  rating?: number;
  requires_revision: boolean;
  is_permanent: boolean;
}

export interface FeedbackContext {
  feedbackId: string | null;
  originalConversationId: string | null;
  originalOutputId: string | null;
  isReprocessing: boolean;
  feedbackContent: string;
}

export async function processFeedback(
  supabase: any,
  briefId: string,
  stageId: string,
  agentId: string,
  feedbackId: string | null
): Promise<FeedbackContext | null> {
  if (!feedbackId) return null;

  try {
    console.log('🔍 Processing feedback:', { feedbackId });
    
    // Get the original conversation to link to
    const { data: originalConv, error: convError } = await supabase
      .from('workflow_conversations')
      .select('id')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .eq('agent_id', agentId)
      .is('feedback_id', null)
      .is('original_conversation_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (convError) {
      console.error('❌ Error fetching original conversation:', convError);
    }

    // Get the original output to link to
    const { data: originalOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .select('id')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .is('feedback_id', null)
      .is('original_output_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (outputError) {
      console.error('❌ Error fetching original output:', outputError);
    }

    // Get the feedback content
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('stage_feedback')
      .select('content, rating, requires_revision, is_permanent')
      .eq('id', feedbackId)
      .single();

    if (feedbackError) {
      console.error('❌ Error fetching feedback:', feedbackError);
      return null;
    }

    const feedbackContent = `Previous feedback: ${feedbackData.content}
Rating: ${feedbackData.rating || 'Not rated'}/5
Please address this feedback specifically in your new response.`;

    console.log('✅ Retrieved feedback for processing:', {
      hasFeedback: !!feedbackContent,
      feedbackPreview: feedbackContent.substring(0, 100),
      rating: feedbackData.rating,
      isPermanent: feedbackData.is_permanent
    });

    // Update feedback status if permanent
    if (feedbackData.is_permanent) {
      const { error: updateError } = await supabase
        .from('stage_feedback')
        .update({ processed_for_rag: true })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('❌ Error updating feedback status:', updateError);
      }
    }

    return {
      feedbackId,
      originalConversationId: originalConv?.id || null,
      originalOutputId: originalOutput?.id || null,
      isReprocessing: true,
      feedbackContent
    };
  } catch (error) {
    console.error('❌ Error in processFeedback:', error);
    return null;
  }
}