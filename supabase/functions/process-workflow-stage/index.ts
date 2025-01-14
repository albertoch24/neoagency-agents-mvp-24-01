import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { processAgents } from "./utils/agentProcessing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Processing workflow stage request');
    
    // Parse and validate request body
    const body = await req.json();
    const { briefId, stageId, flowSteps, feedbackId } = body;
    
    // Log the complete request details
    console.log('📝 Request details:', {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      feedbackId: feedbackId || null,
      timestamp: new Date().toISOString()
    });

    // Enhanced validation with detailed error messages
    if (!briefId) {
      throw new Error('Missing required parameter: briefId');
    }
    if (!stageId) {
      throw new Error('Missing required parameter: stageId');
    }
    if (!Array.isArray(flowSteps)) {
      throw new Error('flowSteps must be an array');
    }
    if (flowSteps.length === 0) {
      throw new Error('flowSteps array cannot be empty');
    }

    // Process the workflow and get outputs
    const outputs = await processAgents(
      briefId, 
      stageId, 
      flowSteps, 
      typeof feedbackId === 'string' ? feedbackId : null
    );
    
    console.log('✅ Workflow processed successfully:', {
      outputsCount: outputs?.length,
      firstOutput: outputs?.[0],
      hasFeedback: !!feedbackId,
      feedbackId: feedbackId || null
    });
    
    // Return success response with outputs and CORS headers
    return new Response(
      JSON.stringify({ 
        message: 'Stage processed successfully',
        success: true,
        outputs,
        meta: {
          hasFeedback: !!feedbackId,
          feedbackId: feedbackId || null,
          timestamp: new Date().toISOString()
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
    console.error('❌ Error processing workflow stage:', {
      error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString(),
        timestamp: new Date().toISOString()
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