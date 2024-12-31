import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils/database.ts";
import { fetchBriefDetails, fetchStageDetails, saveBriefOutput } from "./utils/database.ts";
import { processAgent } from "./utils/workflow.ts";

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
    const { briefId, stageId } = await req.json();
    
    if (!briefId || !stageId) {
      throw new Error("Missing required parameters: briefId or stageId");
    }

    console.log("Processing workflow stage:", { briefId, stageId });

    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();

    // Fetch brief details
    const brief = await fetchBriefDetails(supabaseClient, briefId);
    console.log("Found brief:", brief);

    // Fetch stage with its associated flow and steps
    const stage = await fetchStageDetails(supabaseClient, stageId);
    console.log("Found stage with flow:", stage);

    // Update brief's current stage
    const { error: updateError } = await supabaseClient
      .from("briefs")
      .update({ current_stage: stage.name })
      .eq("id", briefId);

    if (updateError) {
      console.error("Error updating brief stage:", updateError);
      throw updateError;
    }

    // Process each agent in the flow
    const outputs = [];
    const flowSteps = stage.flows?.flow_steps || [];
    
    console.log("Processing flow steps:", flowSteps);

    for (const step of flowSteps) {
      const agent = step.agents;
      if (!agent) {
        console.log("No agent found for step:", step);
        continue;
      }

      const output = await processAgent(supabaseClient, agent, brief, stageId);
      outputs.push(output);
    }

    // Save the final output
    await saveBriefOutput(supabaseClient, briefId, stageId, stage.name, outputs);

    return new Response(
      JSON.stringify({ message: "Stage processed successfully" }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
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
          "Content-Type": "application/json"
        }
      }
    );
  }
});