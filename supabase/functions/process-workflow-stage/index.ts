import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

        // Format the output with the correct structure
        const formattedOutput = {
          agent: agent.name,
          stepId: step.id,
          outputs: [{
            type: "conversational",
            content: formatContent(step.requirements, brief)
          }],
          orderIndex: step.order_index,
          requirements: step.requirements
        };

        outputs.push(formattedOutput);

        // Create workflow conversation
        const { error: conversationError } = await supabase
          .from('workflow_conversations')
          .insert({
            brief_id: briefId,
            stage_id: stageId,
            agent_id: step.agent_id,
            content: JSON.stringify(formattedOutput.outputs),
            output_type: 'conversational',
            flow_step_id: step.id
          });

        if (conversationError) {
          console.error('❌ Error creating workflow conversation:', {
            operationId,
            error: conversationError,
            stepId: step.id
          });
          throw conversationError;
        }

      } catch (stepError) {
        console.error('❌ Error processing flow step:', {
          operationId,
          error: stepError,
          stepId: step.id
        });
        throw stepError;
      }
    }

    // Prepare the content object with the correct structure
    const content = {
      outputs,
      flow_name: stage.flows?.name || '',
      stage_name: stage.name,
      agent_count: flowSteps.length,
      feedback_used: feedbackId ? 'Feedback incorporated' : null
    };

    // Save brief output
    const { data: briefOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stage.name,
        stage_id: stageId,
        content,
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
      { headers: corsHeaders }
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
        headers: corsHeaders
      }
    );
  }
});

// Helper function to format the content based on requirements and brief data
function formatContent(requirements: string, brief: any): string {
  // Create a structured markdown response based on the requirements
  let content = `### Refined Creative Brief\n\n`;
  
  // Add project objectives section
  content += `**Project Objectives:**\n`;
  if (brief.objectives) {
    const objectives = brief.objectives.split('\n').filter(Boolean);
    objectives.forEach(obj => content += `- ${obj.trim()}\n`);
  }

  // Add target audience section
  content += `\n**Target Audience:**\n`;
  if (brief.target_audience) {
    const audience = brief.target_audience.split('\n').filter(Boolean);
    audience.forEach(aud => content += `- ${aud.trim()}\n`);
  }

  // Add timeline section if available
  if (brief.timeline) {
    content += `\n**Timeline:**\n${brief.timeline}\n`;
  }

  // Add budget information if available
  if (brief.budget) {
    content += `\n**Budget Considerations:**\n${brief.budget}\n`;
  }

  // Add requirements section
  if (requirements) {
    content += `\n**Requirements:**\n${requirements}\n`;
  }

  return content;
}