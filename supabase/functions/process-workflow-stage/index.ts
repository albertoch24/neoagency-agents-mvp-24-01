import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processAgents } from "./utils/agentProcessing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing workflow stage request');
    
    // Parse and validate request body
    const body = await req.json();
    console.log('Request body:', body);

    const { briefId, stageId, flowSteps } = body;
    
    // Enhanced validation
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
    
    // Validate each flow step has required properties
    flowSteps.forEach((step, index) => {
      if (!step.agent_id) {
        throw new Error(`Flow step at index ${index} is missing agent_id`);
      }
      if (typeof step.order_index !== 'number') {
        throw new Error(`Flow step at index ${index} is missing order_index`);
      }
    });
    
    console.log('Processing workflow for:', { 
      briefId, 
      stageId, 
      flowStepsCount: flowSteps.length,
      flowSteps: flowSteps.map(step => ({
        id: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index
      }))
    });
    
    // Process the workflow
    const outputs = await processAgents(briefId, stageId, flowSteps);
    
    console.log('Workflow processed successfully:', {
      outputsCount: outputs?.length,
      firstOutput: outputs?.[0]
    });
    
    // Return success response with CORS headers
    return new Response(
      JSON.stringify({ 
        message: 'Stage processed successfully', 
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
    console.error('Error processing workflow stage:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Return error response with CORS headers
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