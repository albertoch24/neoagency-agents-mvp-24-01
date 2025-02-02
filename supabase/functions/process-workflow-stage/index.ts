import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processStageWithEnhancedAgents } from "./utils/enhancedWorkflow.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  console.log('🚀 Starting enhanced workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString(),
    version: '2.0.0', // Aggiunto per verificare la versione deployata
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    console.log('📥 Received request parameters:', {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('🔑 Environment check passed');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief details with detailed logging
    console.log('🔍 Fetching brief details...');
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('❌ Brief fetch error:', briefError);
      throw briefError;
    }

    console.log('✅ Brief fetched successfully');

    // Fetch current stage details with detailed logging
    console.log('🔍 Fetching stage details...');
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

    if (stageError) {
      console.error('❌ Stage fetch error:', stageError);
      throw stageError;
    }

    console.log('✅ Stage fetched successfully');

    // Process stage with enhanced agents and detailed logging
    console.log('🤖 Initializing enhanced agents...');
    const outputs = await processStageWithEnhancedAgents(
      supabase,
      brief,
      currentStage,
      flowSteps,
      feedbackId
    );

    console.log('📊 Processing complete:', {
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
          hasFeedback: !!feedbackId,
          version: '2.0.0'
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
          timestamp: new Date().toISOString(),
          version: '2.0.0'
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