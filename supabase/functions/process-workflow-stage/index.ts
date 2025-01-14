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
    const { briefId, stageId, flowSteps, isReprocessing, feedback, queryParams } = body;
    
    // Log the complete request details
    console.log('Request details:', {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      isReprocessing,
      hasFeedback: !!feedback,
      queryParams
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

    // Validate query parameters
    const finalIsReprocessing = isReprocessing || (queryParams?.isReprocessing === true);
    const hasFeedback = !!feedback || (queryParams?.hasFeedback === true);
    
    console.log('Validated processing flags:', {
      finalIsReprocessing,
      hasFeedback,
      originalIsReprocessing: isReprocessing,
      queryParamsReprocessing: queryParams?.isReprocessing
    });
    
    // Validate each flow step has required properties
    flowSteps.forEach((step, index) => {
      if (!step) {
        throw new Error(`Flow step at index ${index} is undefined`);
      }
      if (!step.agent_id) {
        throw new Error(`Flow step at index ${index} is missing agent_id`);
      }
      if (typeof step.order_index !== 'number') {
        throw new Error(`Flow step at index ${index} is missing order_index`);
      }
    });
    
    // Process the workflow and get outputs
    const outputs = await processAgents(briefId, stageId, flowSteps, finalIsReprocessing, feedback);
    
    console.log('Workflow processed successfully:', {
      outputsCount: outputs?.length,
      firstOutput: outputs?.[0],
      isReprocessing: finalIsReprocessing,
      hasFeedback
    });
    
    // Return success response with outputs and CORS headers
    return new Response(
      JSON.stringify({ 
        message: 'Stage processed successfully',
        success: true,
        outputs,
        meta: {
          isReprocessing: finalIsReprocessing,
          hasFeedback
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