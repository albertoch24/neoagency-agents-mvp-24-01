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

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
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

    // Process each flow step
    const outputs = [];
    for (const step of flowSteps) {
      console.log('Processing flow step:', {
        stepId: step.id,
        agentId: step.agent_id,
        timestamp: new Date().toISOString()
      });

      // Get agent details
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', step.agent_id)
        .single();

      if (!agent) {
        console.error('Agent not found:', step.agent_id);
        continue;
      }

      // Process step with agent
      const stepOutput = {
        stepId: step.agent_id,
        agent: agent.name,
        requirements: step.requirements,
        outputs: [{
          content: `Processed by ${agent.name}: ${step.requirements || 'No specific requirements'}`,
          type: 'conversational'
        }]
      };

      outputs.push(stepOutput);
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
          outputs
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