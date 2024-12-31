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
    
    // Validate required parameters
    if (!briefId) {
      throw new Error("Missing required parameter: briefId");
    }
    if (!stageId) {
      throw new Error("Missing required parameter: stageId");
    }
    if (!flowId) {
      throw new Error("Missing required parameter: flowId");
    }

    console.log("Processing workflow stage with parameters:", { briefId, stageId, flowId, flowSteps });

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

    if (!flowSteps || !Array.isArray(flowSteps)) {
      throw new Error("Invalid or missing flowSteps parameter");
    }

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

      // Save the conversation - ensure content is never null
      if (output && output.outputs && output.outputs[0] && output.outputs[0].content) {
        await saveConversation(supabaseClient, briefId, stageId, agent.id, output.outputs[0].content);
      } else {
        console.error("Invalid output format from agent:", output);
      }
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