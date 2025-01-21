import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ContextManager } from "./utils/contextManager.ts";
import { ParallelProcessor } from "./utils/parallelProcessor.ts";
import { ErrorHandler } from "./utils/errorHandler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = `workflow_stage_${Date.now()}`;
  const startTime = performance.now();
  
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

    // Initialize context manager and parallel processor
    const contextManager = new ContextManager(briefId, stageId);
    const processor = new ParallelProcessor(contextManager);

    // Set up processing nodes with dependencies
    for (const step of flowSteps) {
      processor.addNode(step.agent_id, []);
      contextManager.initializeAgentContext(step.agent_id, step.requirements || '');
    }

    // Process agents with error handling and recovery
    const processAgent = async (agentId: string, context: ContextManager) => {
      const processingContext = {
        resource: 'agent-processing',
        agentId,
        briefId,
        stageId,
        startTime,
        retryCount: 0
      };

      try {
        const step = flowSteps.find((s: any) => s.agent_id === agentId);
        const agentContext = context.getAgentContext(agentId);

        if (!step || !agentContext) {
          throw new Error(`Invalid step or context for agent ${agentId}`);
        }

        // Get agent data with error handling
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('*, skills(*)')
          .eq('id', agentId)
          .single();

        if (agentError) {
          throw agentError;
        }

        // Format and return output
        return {
          agent: agent.name,
          stepId: step.id,
          outputs: [{
            type: "conversational",
            content: `Processed output for ${agent.name}`
          }],
          orderIndex: step.order_index,
          requirements: step.requirements
        };
      } catch (error) {
        return await ErrorHandler.handleError(error, processingContext, async () => {
          // Fallback processing logic
          const { data: agent } = await supabase
            .from('agents')
            .select('name')
            .eq('id', agentId)
            .single();

          return {
            agent: agent?.name || 'Unknown Agent',
            stepId: flowSteps.find((s: any) => s.agent_id === agentId)?.id,
            outputs: [{
              type: "conversational",
              content: "Fallback output due to processing error"
            }],
            orderIndex: 0,
            requirements: "Error recovery output"
          };
        });
      }
    };

    // Process all agents
    const outputs = await processor.processNodes(processAgent);

    // Save processing metrics
    const endTime = performance.now();
    const processingMetrics = {
      duration: endTime - startTime,
      agentCount: flowSteps.length,
      successfulOutputs: outputs.size,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString()
    };

    // Prepare the content object
    const content = {
      outputs: Array.from(outputs.values()),
      flow_name: flowSteps[0]?.flows?.name || '',
      stage_name: flowSteps[0]?.stages?.name || '',
      agent_count: flowSteps.length,
      feedback_used: feedbackId ? 'Feedback incorporated' : null
    };

    // Save brief output with metrics
    const { data: briefOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content,
        feedback_id: feedbackId || null,
        processing_metrics: processingMetrics
      })
      .select()
      .single();

    if (outputError) {
      throw outputError;
    }

    console.log('✅ Processing completed successfully:', {
      operationId,
      outputId: briefOutput.id,
      outputsCount: outputs.size,
      metrics: processingMetrics
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs: Array.from(outputs.values()),
        briefOutputId: briefOutput.id,
        metrics: processingMetrics
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    const structuredError = await ErrorHandler.handleError(error, {
      resource: 'workflow-stage',
      operationId,
      duration: performance.now() - startTime
    });

    return new Response(
      JSON.stringify({
        error: structuredError.message,
        code: structuredError.code,
        category: structuredError.category,
        metrics: structuredError.metrics
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});