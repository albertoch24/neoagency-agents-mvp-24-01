import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ContextManager } from "./utils/contextManager.ts";
import { ParallelProcessor } from "./utils/parallelProcessor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `workflow_stage_${Date.now()}`;
  
  try {
    console.log('🚀 Starting workflow stage processing:', {
      operationId,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId and stageId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Initialize context manager
    const contextManager = new ContextManager(briefId, stageId);
    
    // Initialize parallel processor
    const processor = new ParallelProcessor(contextManager);

    // Set up processing nodes with dependencies
    for (const step of flowSteps) {
      processor.addNode(step.agent_id, []);
      contextManager.initializeAgentContext(step.agent_id, step.requirements || '');
    }

    // Process agents in parallel while maintaining context
    const processAgent = async (agentId: string, context: ContextManager) => {
      const step = flowSteps.find((s: any) => s.agent_id === agentId);
      const agentContext = context.getAgentContext(agentId);

      if (!step || !agentContext) {
        throw new Error(`Invalid step or context for agent ${agentId}`);
      }

      // Get agent data
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', agentId)
        .single();

      if (agentError) {
        throw agentError;
      }

      // Format the output
      const formattedOutput = {
        agent: agent.name,
        stepId: step.id,
        outputs: [{
          type: "conversational",
          content: `Processed output for ${agent.name}`
        }],
        orderIndex: step.order_index,
        requirements: step.requirements
      };

      // Update context with new output
      context.addOutput(agentId, formattedOutput);
      
      // Create workflow conversation
      const { error: conversationError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agentId,
          content: JSON.stringify(formattedOutput.outputs),
          output_type: 'conversational',
          flow_step_id: step.id
        });

      if (conversationError) {
        throw conversationError;
      }

      return formattedOutput;
    };

    // Process all agents
    const outputs = await processor.processNodes(processAgent);

    // Prepare the content object
    const content = {
      outputs: Array.from(outputs.values()),
      flow_name: flowSteps[0]?.flows?.name || '',
      stage_name: flowSteps[0]?.stages?.name || '',
      agent_count: flowSteps.length,
      feedback_used: feedbackId ? 'Feedback incorporated' : null
    };

    // Save brief output
    const { data: briefOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content,
        feedback_id: feedbackId || null
      })
      .select()
      .single();

    if (outputError) {
      throw outputError;
    }

    console.log('✅ Processing completed successfully:', {
      operationId,
      outputId: briefOutput.id,
      outputsCount: outputs.size
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs: Array.from(outputs.values()),
        briefOutputId: briefOutput.id
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('💥 Error in workflow stage processing:', {
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