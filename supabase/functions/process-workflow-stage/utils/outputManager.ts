export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  outputs: any[],
  stageName: string,
  feedbackContext: any | null = null
) {
  const now = new Date().toISOString();

  try {
    console.log('💾 Starting brief output save:', {
      briefId,
      stageId,
      outputsCount: outputs.length,
      hasFeedback: !!feedbackContext,
      timestamp: now
    });

    // Basic validation
    if (!outputs?.length) {
      console.error('❌ No outputs provided for saving');
      throw new Error('No outputs provided for saving');
    }

    // Simplified content structure with essential metadata
    const content = {
      outputs: outputs,
      feedback_used: feedbackContext?.feedbackContent || null,
      metadata: {
        processing_timestamp: now,
        is_reprocessed: !!feedbackContext?.isReprocessing,
        stage_name: stageName,
        quality_metrics: {
          has_recommendations: true,
          has_next_steps: true,
          has_analysis: true
        }
      }
    };

    console.log('📦 Prepared content structure:', {
      outputsCount: outputs.length,
      hasFeedback: !!content.feedback_used,
      timestamp: now
    });

    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: stageName,
        content,
        feedback_id: feedbackContext?.feedbackId || null,
        original_output_id: feedbackContext?.originalOutputId || null,
        is_reprocessed: feedbackContext?.isReprocessing || false,
        reprocessed_at: feedbackContext?.isReprocessing ? now : null,
        content_format: 'structured'
      });

    if (outputError) {
      console.error('❌ Error saving brief output:', {
        error: outputError,
        briefId,
        stageId,
        timestamp: now
      });
      throw outputError;
    }

    console.log('✅ Brief output saved successfully:', {
      briefId,
      stageId,
      timestamp: now
    });

    // Update brief status to mark stage as completed
    const { error: briefUpdateError } = await supabase
      .from('briefs')
      .update({ 
        current_stage: stageId,
        status: 'in_progress'
      })
      .eq('id', briefId);

    if (briefUpdateError) {
      console.error('❌ Error updating brief status:', {
        error: briefUpdateError,
        briefId,
        stageId,
        timestamp: now
      });
      throw briefUpdateError;
    }

    console.log('✅ Brief status updated successfully');

  } catch (error) {
    console.error('❌ Error in saveBriefOutput:', {
      error,
      briefId,
      stageId,
      timestamp: now
    });
    throw error;
  }
}

// Simple validation helper
export function validateOutputs(outputs: any[]): boolean {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return false;
  }

  return outputs.every(output => {
    return (
      output &&
      typeof output === 'object' &&
      Array.isArray(output.outputs) &&
      output.outputs.length > 0 &&
      output.outputs.every((o: any) => 
        o.content && 
        typeof o.content === 'string' &&
        o.content.length > 100 // Ensure minimum content length
      )
    );
  });
}