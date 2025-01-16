import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const operationId = `workflow_stage_${Date.now()}`;
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting workflow stage processing:', {
      operationId,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    console.log('📝 Received request parameters:', {
      operationId,
      briefId,
      stageId,
      hasFlowSteps: !!flowSteps?.length,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId
    });

    // Validate required parameters
    if (!briefId || !stageId) {
      console.error('❌ Missing required parameters:', { briefId, stageId });
      throw new Error('Missing required parameters: briefId and stageId are required');
    }

    // Get brief data
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('❌ Error fetching brief:', {
        operationId,
        error: briefError,
        briefId
      });
      throw briefError;
    }

    console.log('✅ Brief data retrieved:', {
      operationId,
      briefId: brief.id,
      title: brief.title
    });

    // Get stage data
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (
            id,
            agent_id,
            requirements,
            order_index,
            outputs,
            description
          )
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError) {
      console.error('❌ Error fetching stage:', {
        operationId,
        error: stageError,
        stageId
      });
      throw stageError;
    }

    console.log('✅ Stage data retrieved:', {
      operationId,
      stageId: stage.id,
      stageName: stage.name,
      flowStepsCount: stage.flows?.flow_steps?.length || 0
    });

    // Process each flow step
    const outputs = [];
    for (const step of flowSteps) {
      console.log('🔄 Processing flow step:', {
        operationId,
        stepId: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index
      });

      try {
        // Get agent data
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', step.agent_id)
          .single();

        if (agentError) {
          console.error('❌ Error fetching agent:', {
            operationId,
            error: agentError,
            agentId: step.agent_id
          });
          throw agentError;
        }

        console.log('✅ Agent data retrieved:', {
          operationId,
          agentId: agent.id,
          agentName: agent.name
        });

        // Create workflow conversation
        const { data: conversation, error: conversationError } = await supabase
          .from('workflow_conversations')
          .insert({
            brief_id: briefId,
            stage_id: stageId,
            agent_id: step.agent_id,
            content: JSON.stringify(step.outputs || []),
            output_type: 'conversational',
            flow_step_id: step.id
          })
          .select()
          .single();

        if (conversationError) {
          console.error('❌ Error creating workflow conversation:', {
            operationId,
            error: conversationError,
            stepId: step.id
          });
          throw conversationError;
        }

        console.log('✅ Workflow conversation created:', {
          operationId,
          conversationId: conversation.id,
          stepId: step.id
        });

        outputs.push({
          agent: agent.name,
          stepId: step.id,
          outputs: step.outputs || [],
          orderIndex: step.order_index,
          requirements: step.requirements
        });

      } catch (stepError) {
        console.error('❌ Error processing flow step:', {
          operationId,
          error: stepError,
          stepId: step.id
        });
        throw stepError;
      }
    }

    // Save brief output
    const { data: briefOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stage.name,
        stage_id: stageId,
        content: {
          outputs,
          feedback_used: feedbackId ? 'Feedback incorporated' : null
        },
        feedback_id: feedbackId || null
      })
      .select()
      .single();

    if (outputError) {
      console.error('❌ Error saving brief output:', {
        operationId,
        error: outputError,
        briefId,
        stageId
      });
      throw outputError;
    }

    console.log('✅ Brief output saved successfully:', {
      operationId,
      outputId: briefOutput.id,
      outputsCount: outputs.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        briefOutputId: briefOutput.id
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in workflow stage processing:', {
      operationId,
      error: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
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