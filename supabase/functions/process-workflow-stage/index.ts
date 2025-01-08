import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils/database.ts";
import { corsHeaders } from "./utils/cors.ts";
import { validateRequest, validateStage, validateBrief } from "./utils/validation.ts";
import { processAgents } from "./utils/agentProcessing.ts";

serve(async (req) => {
  // Always add CORS headers
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    console.log("Starting workflow stage processing");
    
    // Validate request and parameters
    const { briefId, stageId, flowId, flowSteps } = await validateRequest(req);
    
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();
    
    // Validate stage and brief
    const stage = await validateStage(supabaseClient, stageId);
    const brief = await validateBrief(supabaseClient, briefId);
    
    // Process agents and collect outputs
    const outputs = await processAgents(
      supabaseClient,
      flowSteps,
      brief,
      stageId,
      stage.name
    );

    console.log("Stage processing completed successfully");

    return new Response(
      JSON.stringify({ 
        message: "Stage processed successfully", 
        outputs 
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error processing workflow stage:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        details: error.toString()
      }),
      { 
        status: 500,
        headers
      }
    );
  }
});