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

    // Determine if this is the first stage
    const isFirstStage = !previousOutputs || previousOutputs.length === 0;

    console.log('📊 Stage processing context:', {
      operationId,
      isFirstStage,
      previousOutputsCount: previousOutputs?.length || 0,
      timestamp: new Date().toISOString()
    });

    const outputs = [];

    // Update the processAgent call to include isFirstStage
    for (const step of flowSteps) {
      try {
        console.log('🤖 Processing agent step:', {
          operationId,
          stepId: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index,
          isFirstStage,
          timestamp: new Date().toISOString()
        });

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
          isFirstStage,
          timestamp: new Date().toISOString()
        });
        continue;
      }
    }

    // Handle response
    return new Response(
      JSON.stringify({ success: true, outputs }),
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
