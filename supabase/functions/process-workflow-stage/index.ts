import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processAgent } from "./utils/workflow.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get request body
    const { briefId, stageId, flowSteps, feedback } = await req.json();
    
    console.log('Processing workflow stage:', {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedback
    });

    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId and stageId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the brief details
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('Error fetching brief:', briefError);
      throw briefError;
    }

    // Process each flow step
    const outputs = [];
    for (const step of flowSteps) {
      console.log('Processing step:', {
        stepId: step.id,
        agentId: step.agent_id,
        requirements: step.requirements?.substring(0, 100) + '...'
      });

      const { data: agent } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', step.agent_id)
        .single();

      if (!agent) {
        console.error('Agent not found:', step.agent_id);
        continue;
      }

      const output = await processAgent(
        supabase,
        agent,
        brief,
        stageId,
        step.requirements || '',
        outputs, // Pass previous outputs for context
        feedback // Pass feedback if available
      );

      outputs.push(output);
    }

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({ 
        message: "Stage processed successfully",
        outputs 
      }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in process-workflow-stage:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
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