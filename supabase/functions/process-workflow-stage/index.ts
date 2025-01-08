import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('Processing workflow stage request');
    
    const { briefId, stageId, flowId, flowSteps } = await req.json();
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId and stageId are required');
    }
    
    console.log('Processing workflow for:', { briefId, stageId, flowId, flowSteps });
    
    const outputs = await processAgents(briefId, stageId);
    
    console.log('Workflow processed successfully:', outputs);
    
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