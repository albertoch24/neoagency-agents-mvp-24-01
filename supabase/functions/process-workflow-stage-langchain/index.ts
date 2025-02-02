import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { AgentFactory } from "./utils/agents/AgentFactory.ts";
import { processAgentInteractions } from "./utils/langchainAgents.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();

    console.log("🚀 LangChain Edge Function - Starting processing:", {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch brief data
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      throw new Error(`Error fetching brief: ${briefError.message}`);
    }

    // Initialize agents based on flow steps
    const agents = flowSteps.map(step => {
      const agent = AgentFactory.createAgent(step.agent_id, step.requirements);
      return {
        ...agent,
        stepId: step.id,
        orderIndex: step.order_index
      };
    });

    console.log("🤖 Initialized agents:", {
      count: agents.length,
      agentTypes: agents.map(a => a.role)
    });

    // Create agent chain
    const executor = await processAgentInteractions(agents, brief, flowSteps);

    // Process each agent in sequence
    const outputs = [];
    for (const agent of agents) {
      console.log(`Processing agent ${agent.role}...`);
      
      const result = await executor.invoke({
        input: `
          Brief: ${brief.title}
          Description: ${brief.description}
          Requirements: ${agent.requirements}
          Previous outputs: ${outputs.map(o => o.content).join('\n')}
        `
      });

      outputs.push({
        agent: agent.role,
        stepId: agent.stepId,
        outputs: [{
          type: "conversational",
          content: result.output
        }],
        orderIndex: agent.orderIndex
      });
    }

    // Save outputs to database
    const { error: outputError } = await supabaseClient
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content: {
          outputs
        }
      });

    if (outputError) {
      throw new Error(`Error saving outputs: ${outputError.message}`);
    }

    // Save workflow conversations
    for (const output of outputs) {
      const { error: conversationError } = await supabaseClient
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: output.stepId,
          content: output.outputs[0].content,
          output_type: "conversational",
          flow_step_id: output.stepId
        });

      if (conversationError) {
        console.error("Error saving conversation:", conversationError);
      }
    }

    console.log("✅ Processing completed successfully:", {
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ outputs }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("❌ Error in edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});