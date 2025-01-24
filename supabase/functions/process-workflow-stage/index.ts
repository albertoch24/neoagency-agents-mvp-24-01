import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  console.log('🚀 Starting workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      console.error('❌ Invalid request parameters:', {
        operationId,
        briefId,
        stageId,
        hasFlowSteps: !!flowSteps,
        timestamp: new Date().toISOString()
      });
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief details
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) throw briefError;

    // Fetch previous stage outputs
    const { data: previousOutputs, error: outputsError } = await supabase
      .from('brief_outputs')
      .select('content, stage_id')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: true });

    if (outputsError) throw outputsError;

    console.log('📊 Previous outputs retrieved:', {
      operationId,
      outputCount: previousOutputs?.length,
      timestamp: new Date().toISOString()
    });

    // Fetch current stage details
    const { data: currentStage, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          description
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError) throw stageError;

    const outputs = [];
    console.log('👥 Processing agents:', {
      operationId,
      agentCount: flowSteps.length,
      timestamp: new Date().toISOString()
    });

    // Determine if this is the first stage
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('id, order_index')
      .eq('user_id', brief.user_id)
      .order('order_index', { ascending: true });

    if (stagesError) throw stagesError;

    const isFirstStage = stages[0]?.id === stageId;

    console.log('📊 Stage context:', {
      operationId,
      isFirstStage,
      stageId,
      totalStages: stages.length,
      timestamp: new Date().toISOString()
    });

    // Process each agent with context
    for (const step of flowSteps) {
      try {
        const output = await processAgent(
          supabase,
          step,
          brief,
          stageId,
          step.requirements,
          previousOutputs,
          isFirstStage
        );
        outputs.push(output);
      } catch (stepError) {
        console.error('❌ Error processing agent step:', {
          operationId,
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id,
          timestamp: new Date().toISOString()
        });
        continue;
      }
    }

    // Save the combined output
    const { error: saveError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: currentStage.name,
        content: {
          stage_name: currentStage.name,
          flow_name: currentStage.flows?.name,
          outputs: outputs
        },
        feedback_id: feedbackId || null,
        content_format: 'structured'
      });

    if (saveError) throw saveError;

    // Update brief status
    const { error: briefUpdateError } = await supabase
      .from('briefs')
      .update({ 
        current_stage: stageId,
        status: 'in_progress'
      })
      .eq('id', briefId);

    if (briefUpdateError) throw briefUpdateError;

    console.log('✅ Workflow stage processing completed:', {
      operationId,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metrics: {
          operationId,
          processedAt: new Date().toISOString(),
          agentsProcessed: outputs.length,
          hasFeedback: !!feedbackId
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in workflow stage processing:', {
      operationId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.stack,
        context: {
          operationId,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
