import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateWorkflowData } from "./utils/validation.ts";
import { processAgent } from "./utils/workflow.ts";

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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      console.error('❌ Invalid request parameters:', {
        operationId,
        briefId,
        stageId,
        hasFlowSteps: !!flowSteps,
        hasFeedback: !!feedbackId,
        timestamp: new Date().toISOString()
      });
      throw new Error('Missing required parameters: briefId, stageId, or flowSteps');
    }

    console.log('📝 Processing request:', {
      operationId,
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brief, stage } = await validateWorkflowData(briefId, stageId);

    let originalOutput = null;
    if (feedbackId) {
      const { data: output, error: outputError } = await supabase
        .from('brief_outputs')
        .select('*')
        .eq('brief_id', briefId)
        .eq('stage_id', stageId)
        .eq('is_reprocessed', false)
        .maybeSingle();

      if (outputError) throw new Error('Failed to fetch original output');
      if (!output) throw new Error('No original output found to process feedback against');
      originalOutput = output;
    }

    const outputs = [];
    console.log('👥 Processing agents:', {
      operationId,
      agentCount: flowSteps.length,
      timestamp: new Date().toISOString()
    });

    for (const step of flowSteps) {
      try {
        console.log('🤖 Processing agent step:', {
          operationId,
          stepId: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index,
          timestamp: new Date().toISOString()
        });

        const result = await processAgent(
          supabase,
          step.agents,
          brief,
          stageId,
          step.requirements,
          outputs
        );

        if (result) {
          outputs.push(result);
          console.log('✅ Agent processing completed:', {
            operationId,
            stepId: step.id,
            agentId: step.agent_id,
            timestamp: new Date().toISOString()
          });
        }
      } catch (stepError) {
        console.error('❌ Error processing agent step:', {
          operationId,
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id,
          timestamp: new Date().toISOString()
        });
        continue;
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
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
      console.error('❌ Error updating brief status:', briefUpdateError);
      throw briefUpdateError;
    }

    console.log('✅ Workflow stage processing completed:', {
      operationId,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metrics: {
          operationId,
          processedAt: new Date().toISOString(),
          agentsProcessed: outputs.length,
          hasFeedback: !!feedbackId,
          originalOutputId: originalOutput?.id
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