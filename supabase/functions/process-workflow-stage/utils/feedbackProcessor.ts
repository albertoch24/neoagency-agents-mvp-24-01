import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processFeedback(briefId: string, stageId: string, feedbackId: string) {
  const operationId = `feedback_processing_${briefId}_${Date.now()}`;
  
  try {
    console.log('🔍 Debug Operation Started:', {
      operationId,
      briefId,
      stageId,
      feedbackId,
      timestamp: new Date().toISOString()
    });

    // 1. Verify Brief Exists
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('❌ Brief Verification Failed:', {
        operationId,
        error: briefError,
        briefId
      });
      throw new Error(`Brief not found: ${briefError.message}`);
    }

    console.log('✅ Brief Verified:', {
      operationId,
      briefId,
      briefTitle: brief.title,
      briefStatus: brief.status
    });

    // 2. Verify Stage Exists
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (stageError) {
      console.error('❌ Stage Verification Failed:', {
        operationId,
        error: stageError,
        stageId
      });
      throw new Error(`Stage not found: ${stageError.message}`);
    }

    console.log('✅ Stage Verified:', {
      operationId,
      stageId,
      stageName: stage.name
    });

    // 3. Get ALL outputs for this brief
    const { data: allOutputs, error: outputsError } = await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false });

    if (outputsError) {
      console.error('❌ Outputs Query Failed:', {
        operationId,
        error: outputsError
      });
      throw new Error(`Failed to fetch outputs: ${outputsError.message}`);
    }

    console.log('📊 All Brief Outputs:', {
      operationId,
      totalOutputs: allOutputs?.length || 0,
      outputIds: allOutputs?.map(o => o.id),
      creationDates: allOutputs?.map(o => o.created_at)
    });

    // 4. Get outputs specific to this stage
    const { data: stageOutputs, error: stageOutputsError } = await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .order('created_at', { ascending: false });

    if (stageOutputsError) {
      console.error('❌ Stage Outputs Query Failed:', {
        operationId,
        error: stageOutputsError
      });
      throw new Error(`Failed to fetch stage outputs: ${stageOutputsError.message}`);
    }

    console.log('📊 Stage-Specific Outputs:', {
      operationId,
      totalStageOutputs: stageOutputs?.length || 0,
      stageOutputIds: stageOutputs?.map(o => o.id),
      reprocessedStatus: stageOutputs?.map(o => o.is_reprocessed)
    });

    // 5. Get the original output (most recent non-reprocessed)
    const originalOutput = stageOutputs?.[0];

    if (!originalOutput) {
      console.error('❌ No Original Output Found:', {
        operationId,
        briefId,
        stageId,
        allOutputsCount: allOutputs?.length || 0,
        stageOutputsCount: stageOutputs?.length || 0
      });
      throw new Error('No original output found to process feedback against');
    }

    console.log('✅ Original Output Found:', {
      operationId,
      outputId: originalOutput.id,
      createdAt: originalOutput.created_at,
      isReprocessed: originalOutput.is_reprocessed,
      contentSample: JSON.stringify(originalOutput.content).substring(0, 200) + '...'
    });

    // 6. Get the feedback content
    const { data: feedback, error: feedbackError } = await supabase
      .from('stage_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (feedbackError) {
      console.error('❌ Feedback Query Failed:', {
        operationId,
        error: feedbackError
      });
      throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);
    }

    console.log('✅ Feedback Retrieved:', {
      operationId,
      feedbackId,
      feedbackContent: feedback.content.substring(0, 200) + '...',
      requiresRevision: feedback.requires_revision
    });

    return {
      originalOutput,
      feedback,
      debugInfo: {
        operationId,
        totalOutputs: allOutputs?.length || 0,
        stageOutputs: stageOutputs?.length || 0,
        brief: brief.title,
        stage: stage.name
      }
    };

  } catch (error) {
    console.error('💥 Processing Failed:', {
      operationId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}