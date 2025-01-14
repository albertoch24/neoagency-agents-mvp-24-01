import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { StructuredFeedback } from "../types.ts";

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

    // Get feedback data with structured content
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('stage_feedback')
      .select(`
        id,
        content,
        structured_content,
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
      hasStructuredContent: !!feedbackData.structured_content,
      contentPreview: feedbackData.content.substring(0, 100) + '...',
      isPermanent: feedbackData.is_permanent,
      requiresRevision: feedbackData.requires_revision
    });

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

    // Process structured feedback if available
    const structuredContent = feedbackData.structured_content as StructuredFeedback;
    const processedFeedback = {
      generalFeedback: structuredContent?.general_feedback || feedbackData.content,
      specificChanges: structuredContent?.specific_changes || [],
      priorityLevel: structuredContent?.priority_level || 'medium',
      targetImprovements: structuredContent?.target_improvements || [],
      revisionNotes: structuredContent?.revision_notes || ''
    };

    console.log('✅ Processed structured feedback:', processedFeedback);

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

    // Return complete feedback context
    return {
      feedbackContent: processedFeedback,
      isReprocessing: true,
      isPermanent: feedbackData.is_permanent,
      requiresRevision: feedbackData.requires_revision,
      originalConversationId: originalConversations?.[0]?.id,
      processingTimeSeconds: Math.round((new Date().getTime() - startTime.getTime()) / 1000)
    };

  } catch (error) {
    console.error('❌ Error in processFeedback:', error);
    throw error;
  }
}