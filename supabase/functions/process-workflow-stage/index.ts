import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils/database.ts";
import { corsHeaders } from "./utils/cors.ts";
import { processAgent } from "./utils/workflow.ts";
import { validateRequest, validateStage, validateBrief } from "./utils/validation.ts";

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
    
    // Parse request body
    const { briefId, stageId, flowId, flowSteps } = await req.json();
    console.log("Received request params:", { briefId, stageId, flowId });

    if (!briefId || !stageId || !flowId) {
      throw new Error("Missing required parameters");
    }
    
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();
    
    // Validate stage and brief
    const stage = await validateStage(supabaseClient, stageId);
    const brief = await validateBrief(supabaseClient, briefId);
    
    // Process agents and collect outputs
    const outputs = await processAgent(
      supabaseClient,
      stage.flows?.flow_steps[0]?.agents,
      brief,
      stageId,
      stage.flows?.flow_steps[0]?.requirements || ""
    );

    console.log("Stage processing completed successfully");

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
    console.error("Error processing workflow stage:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
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