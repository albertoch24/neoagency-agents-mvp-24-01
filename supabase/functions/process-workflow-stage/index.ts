import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processStageWithEnhancedAgents } from "./utils/enhancedWorkflow.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  const version = '2.1.0'; // Aggiornata per tracciare la nuova versione con logging avanzato
  
  console.log('🚀 Starting workflow processing:', {
    operationId,
    version,
    timestamp: new Date().toISOString(),
    environment: Deno.env.get('ENVIRONMENT') || 'development'
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    console.log('📥 Request parameters:', {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      operationId,
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

    console.log('🔑 Environment check passed:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      operationId
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Fetching brief details...', { operationId });
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('❌ Brief fetch error:', {
        error: briefError,
        operationId,
        timestamp: new Date().toISOString()
      });
      throw briefError;
    }

    console.log('✅ Brief fetched successfully:', {
      briefId: brief.id,
      title: brief.title,
      operationId
    });

    console.log('🔍 Fetching stage details...', { operationId });
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
      console.error('❌ Stage fetch error:', {
        error: stageError,
        operationId,
        timestamp: new Date().toISOString()
      });
      throw stageError;
    }

    console.log('✅ Stage fetched successfully:', {
      stageId: currentStage.id,
      stageName: currentStage.name,
      operationId
    });

    console.log('🤖 Starting enhanced workflow processing...', {
      operationId,
      timestamp: new Date().toISOString()
    });

    const outputs = await processStageWithEnhancedAgents(
      supabase,
      brief,
      currentStage,
      flowSteps,
      feedbackId
    );

    console.log('📊 Processing complete:', {
      outputsCount: outputs.length,
      operationId,
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
          version
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
    console.error('❌ Error in workflow processing:', {
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
          version
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