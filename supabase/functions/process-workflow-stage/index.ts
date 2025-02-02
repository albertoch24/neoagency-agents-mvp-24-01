import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  console.log('🚀 Starting workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief details
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError || !brief) {
      console.error('Error fetching brief:', briefError);
      throw new Error('Brief not found');
    }

    // Fetch current stage details
    const { data: currentStage, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          description
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError || !currentStage) {
      console.error('Error fetching stage:', stageError);
      throw new Error('Stage not found');
    }

    // Process each flow step
    const outputs = [];
    for (const step of flowSteps) {
      console.log('Processing flow step:', {
        stepId: step.id,
        agentId: step.agent_id,
        timestamp: new Date().toISOString()
      });

      // Get agent details
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          description,
          temperature,
          skills (
            id,
            name,
            type,
            content,
            description
          )
        `)
        .eq('id', step.agent_id)
        .single();

      if (agentError || !agent) {
        console.error('Error fetching agent:', agentError);
        continue;
      }

      // Process step with agent
      const stepOutput = {
        stepId: step.agent_id,
        agent: agent.name,
        requirements: step.requirements,
        outputs: [{
          content: `Processed by ${agent.name}: ${step.requirements || 'No specific requirements'}`,
          type: 'conversational'
        }],
        orderIndex: step.order_index
      };

      // Save workflow conversation
      const { error: conversationError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agent.id,
          content: stepOutput.outputs[0].content,
          output_type: 'conversational',
          flow_step_id: step.id
        });

      if (conversationError) {
        console.error('Error saving conversation:', conversationError);
      }

      outputs.push(stepOutput);
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    // Save the combined output
    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: currentStage.name,
        content: {
          stage_name: currentStage.name,
          flow_name: currentStage.flows?.name,
          outputs: outputs.map(output => ({
            agent: output.agent,
            requirements: output.requirements,
            outputs: output.outputs,
            stepId: output.stepId,
            orderIndex: output.orderIndex
          }))
        },
        feedback_id: feedbackId || null,
        content_format: 'structured'
      });

    if (outputError) {
      console.error('Error saving output:', outputError);
      throw outputError;
    }

    // Update brief status
    const { error: briefUpdateError } = await supabase
      .from('briefs')
      .update({ 
        current_stage: stageId,
        status: 'in_progress'
      })
      .eq('id', briefId);

    if (briefUpdateError) {
      console.error('Error updating brief:', briefUpdateError);
      throw briefUpdateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metrics: {
          operationId,
          processedAt: new Date().toISOString(),
          agentsProcessed: outputs.length,
          hasFeedback: !!feedbackId
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
    console.error('❌ Error in workflow stage processing:', {
      operationId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.stack,
        context: {
          operationId,
          timestamp: new Date().toISOString()
        }
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