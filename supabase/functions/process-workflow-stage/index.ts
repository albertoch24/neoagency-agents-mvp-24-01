import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils/database.ts";
import { corsHeaders } from "./utils/cors.ts";
import { validateRequest, validateStage, validateBrief } from "./utils/validation.ts";
import { processAgents } from "./utils/agentProcessing.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    console.log("Starting workflow stage processing");
    
    // Validate request and parameters
    const { briefId, stageId, flowId, flowSteps } = await validateRequest(req);
    console.log("Request validated:", { briefId, stageId, flowId, flowStepsCount: flowSteps?.length });
    
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();
    
    // Validate stage and brief
    const stage = await validateStage(supabaseClient, stageId);
    console.log("Stage validated:", { stageName: stage.name, stageId: stage.id });
    
    const brief = await validateBrief(supabaseClient, briefId);
    console.log("Brief validated:", { briefTitle: brief.title, briefId: brief.id });
    
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
        outputs,
        stage: {
          id: stage.id,
          name: stage.name
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
    console.error("Error processing workflow stage:", error);
    
    // Return a structured error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});