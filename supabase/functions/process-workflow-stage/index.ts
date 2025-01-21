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
      throw new Error('Missing required parameters: briefId and stageId are required');
    }

    // Validate feedbackId is either null or a valid UUID
    if (feedbackId !== null && typeof feedbackId !== 'string') {
      throw new Error('Invalid feedbackId format');
    }

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

    const outputs = [];
    for (const step of flowSteps) {
      console.log('🔄 Processing flow step:', {
        operationId,
        stepId: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index
      });

      try {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', step.agent_id)
          .single();

        if (agentError) throw agentError;

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

        const { error: conversationError } = await supabase
          .from('workflow_conversations')
          .insert({
            brief_id: briefId,
            stage_id: stageId,
            agent_id: step.agent_id,
            content: JSON.stringify(formattedOutput.outputs),
            output_type: 'conversational',
            flow_step_id: step.id,
            feedback_id: feedbackId || null
          });

        if (conversationError) throw conversationError;
      } catch (stepError) {
        console.error('❌ Error processing flow step:', {
          operationId,
          error: stepError,
          stepId: step.id
        });
        throw stepError;
      }
    }

    // Save brief output with proper type handling
    const briefOutputData = {
      brief_id: briefId,
      stage: brief.name,
      stage_id: stageId,
      content: {
        outputs,
        flow_name: '',
        stage_name: brief.name,
        agent_count: flowSteps.length,
        feedback_used: feedbackId ? 'Feedback incorporated' : null
      },
      feedback_id: feedbackId || null
    };

    console.log('💾 Saving brief output:', {
      operationId,
      data: briefOutputData
    });

    const { data: briefOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .insert(briefOutputData)
      .select()
      .single();

    if (outputError) {
      console.error('❌ Error saving brief output:', {
        operationId,
        error: outputError,
        data: briefOutputData
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

// Helper function to format content
function formatContent(requirements: string, brief: any): string {
  let content = `### Refined Creative Brief\n\n`;
  
  if (brief.objectives) {
    content += `**Project Objectives:**\n`;
    const objectives = brief.objectives.split('\n').filter(Boolean);
    objectives.forEach(obj => content += `- ${obj.trim()}\n`);
  }

  if (brief.target_audience) {
    content += `\n**Target Audience:**\n`;
    const audience = brief.target_audience.split('\n').filter(Boolean);
    audience.forEach(aud => content += `- ${aud.trim()}\n`);
  }

  if (brief.timeline) {
    content += `\n**Timeline:**\n${brief.timeline}\n`;
  }

  if (brief.budget) {
    content += `\n**Budget Considerations:**\n${brief.budget}\n`;
  }

  if (requirements) {
    content += `\n**Requirements:**\n${requirements}\n`;
  }

  return content;
}