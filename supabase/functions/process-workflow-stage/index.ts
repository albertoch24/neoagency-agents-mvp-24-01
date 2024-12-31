import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "./utils/database.ts";
import { fetchBriefDetails, fetchStageDetails, saveBriefOutput, saveConversation } from "./utils/database.ts";
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
    const { briefId, stageId, flowId, flowSteps } = await req.json();
    
    if (!briefId || !stageId || !flowId) {
      throw new Error("Missing required parameters: briefId, stageId, or flowId");
    }

    console.log("Processing workflow stage:", { briefId, stageId, flowId, flowSteps });

    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();

    // Fetch brief details
    const brief = await fetchBriefDetails(supabaseClient, briefId);
    console.log("Found brief:", brief);

    // Fetch stage with its associated flow
    const stage = await fetchStageDetails(supabaseClient, stageId);
    console.log("Found stage:", stage);

    // Process each agent in the flow steps
    const outputs = [];
    
    console.log("Processing flow steps:", flowSteps);

    for (const step of flowSteps) {
      // Fetch agent details including skills
      const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select(`
          *,
          skills (*)
        `)
        .eq("id", step.agent_id)
        .single();

      if (agentError) {
        console.error("Error fetching agent:", agentError);
        continue;
      }

      if (!agent) {
        console.log("No agent found for step:", step);
        continue;
      }

      const output = await processAgent(supabaseClient, agent, brief, stageId, step.requirements);
      outputs.push(output);

      // Save the conversation
      await saveConversation(supabaseClient, briefId, stageId, agent.id, output.content);
    }

    // Save the final output
    await saveBriefOutput(supabaseClient, briefId, stageId, stage.name, outputs);

    return new Response(
      JSON.stringify({ message: "Stage processed successfully", outputs }),
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