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
    
    // Parse request body
    const { briefId, stageId, flowId, flowSteps } = await req.json();
    
    // Validate required parameters
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId and stageId are required');
    }
    
    console.log('Processing workflow for:', { briefId, stageId, flowId, flowSteps });
    
    // Process the workflow
    const outputs = await processAgents(briefId, stageId);
    
    console.log('Workflow processed successfully:', outputs);
    
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
    console.error('Error processing workflow stage:', error);
    
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