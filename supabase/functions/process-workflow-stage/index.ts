import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processAgent } from "./utils/workflow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId } = await req.json();
    
    if (!briefId || !stageId) {
      throw new Error("Missing required parameters: briefId or stageId");
    }

    console.log("Processing workflow stage:", { briefId, stageId });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch brief details
    const { data: brief, error: briefError } = await supabaseClient
      .from("briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefError) {
      console.error("Error fetching brief:", briefError);
      throw briefError;
    }

    console.log("Found brief:", brief);

    // Fetch stage with its associated flow and steps
    const { data: stage, error: stageError } = await supabaseClient
      .from("stages")
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (
            *,
            agents (
              id,
              name,
              description,
              skills (*)
            )
          )
        )
      `)
      .eq("id", stageId)
      .single();

    if (stageError) {
      console.error("Error fetching stage:", stageError);
      throw stageError;
    }

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

      try {
        const output = await processAgent(supabaseClient, agent, brief, stageId);
        outputs.push(output);
      } catch (error) {
        console.error(`Error processing agent ${agent.name}:`, error);
        throw error;
      }
    }

    // Save the final output
    const { error: outputError } = await supabaseClient
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content: {
          stage_name: stage.name,
          outputs: outputs
        }
      });

    if (outputError) {
      console.error("Error saving output:", outputError);
      throw outputError;
    }

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