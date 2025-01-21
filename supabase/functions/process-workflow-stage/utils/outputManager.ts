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
    console.log('💾 Saving brief output:', {
      briefId,
      stageId,
      outputsCount: outputs.length,
      hasFeedback: !!feedbackContext,
      timestamp: now
    });

    // Format the content object
    const content = {
      stage_name: stageName,
      outputs: outputs.map(output => ({
        agent: output.agent,
        requirements: output.requirements,
        outputs: output.outputs,
        stepId: output.stepId,
        orderIndex: output.orderIndex
      })),
      metadata: {
        processing_timestamp: now,
        feedback_used: feedbackContext?.feedbackContent || null,
        is_reprocessed: !!feedbackContext?.isReprocessing
      }
    };

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
      console.error('❌ Error saving brief output:', outputError);
      throw outputError;
    }

    console.log('✅ Brief output saved successfully:', {
      briefId,
      stageId,
      stageName,
      outputsCount: outputs.length,
      timestamp: now
    });

  } catch (error) {
    console.error('❌ Error in saveBriefOutput:', error);
    throw error;
  }
}