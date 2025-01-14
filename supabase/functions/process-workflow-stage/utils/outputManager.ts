export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  outputs: any[],
  feedbackContext: any | null
) {
  const now = new Date().toISOString();

  try {
    console.log('💾 Saving brief output:', {
      briefId,
      stageId,
      outputsCount: outputs.length,
      hasFeedback: !!feedbackContext
    });

    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: stageId,
        content: {
          outputs: outputs,
          feedback_used: feedbackContext?.feedbackContent || null
        },
        feedback_id: feedbackContext?.feedbackId || null,
        original_output_id: feedbackContext?.originalOutputId || null,
        is_reprocessed: feedbackContext?.isReprocessing || false,
        reprocessed_at: feedbackContext?.isReprocessing ? now : null
      });

    if (outputError) {
      console.error('❌ Error saving brief output:', outputError);
      throw outputError;
    }

    console.log('✅ Brief output saved successfully');
  } catch (error) {
    console.error('❌ Error in saveBriefOutput:', error);
    throw error;
  }
}