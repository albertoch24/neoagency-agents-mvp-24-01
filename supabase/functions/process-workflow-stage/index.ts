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
    
    console.log("Received request with parameters:", { briefId, stageId, flowId, flowSteps });

    if (!briefId || !stageId || !flowId || !flowSteps) {
      const missingParams = [];
      if (!briefId) missingParams.push('briefId');
      if (!stageId) missingParams.push('stageId');
      if (!flowId) missingParams.push('flowId');
      if (!flowSteps) missingParams.push('flowSteps');

      console.error("Missing required parameters:", missingParams);
      return new Response(
        JSON.stringify({ 
          error: `Missing required parameters: ${missingParams.join(', ')}` 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();

    // Validate stage exists and has required data
    const { data: stage, error: stageError } = await supabaseClient
      .from("stages")
      .select(`
        *,
        flows (
          id,
          flow_steps (
            id,
            agent_id,
            agents (
              id,
              name,
              skills (*)
            )
          )
        )
      `)
      .eq("id", stageId)
      .maybeSingle();

    if (stageError || !stage) {
      console.error("Stage validation failed:", stageError || "Stage not found");
      return new Response(
        JSON.stringify({ error: "Stage not found or invalid" }), 
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Stage validation successful:", {
      stageId: stage.id,
      stageName: stage.name,
      flowId: stage.flow_id
    });

    if (!stage.flows?.flow_steps?.length) {
      console.error("No flow steps found for stage:", {
        stageId: stage.id,
        flowId: stage.flow_id
      });
      return new Response(
        JSON.stringify({ error: "No valid flow steps found for this stage" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch brief details with validation
    const brief = await fetchBriefDetails(supabaseClient, briefId);
    if (!brief) {
      console.error("Brief not found:", briefId);
      return new Response(
        JSON.stringify({ error: "Brief not found" }), 
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Brief validation successful:", {
      briefId: brief.id,
      title: brief.title,
      currentStage: brief.current_stage
    });

    // Process each agent in the flow steps
    const outputs = [];
    
    console.log("Processing flow steps:", flowSteps);

    for (const step of flowSteps) {
      // Enhanced agent validation
      const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select(`
          *,
          skills (*)
        `)
        .eq("id", step.agent_id)
        .maybeSingle();

      if (agentError || !agent) {
        console.error("Agent validation failed:", {
          stepId: step.id,
          agentId: step.agent_id,
          error: agentError
        });
        return new Response(
          JSON.stringify({ error: `Agent not found for step: ${step.id}` }), 
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log("Agent validation successful:", {
        agentId: agent.id,
        agentName: agent.name,
        skillsCount: agent.skills?.length || 0
      });

      const output = await processAgent(supabaseClient, agent, brief, stageId, step.requirements);
      outputs.push(output);

      if (output && output.outputs && output.outputs[0] && output.outputs[0].content) {
        await saveConversation(supabaseClient, briefId, stageId, agent.id, output.outputs[0].content);
      } else {
        console.error("Invalid output format from agent:", {
          agentId: agent.id,
          agentName: agent.name,
          output
        });
        return new Response(
          JSON.stringify({ error: `Invalid output format from agent: ${agent.name}` }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Save the final output
    await saveBriefOutput(supabaseClient, briefId, stageId, stage.name, outputs);

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