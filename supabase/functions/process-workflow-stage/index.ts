import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { validateWorkflowData } from './utils/dataValidator.ts';
import { processFeedback } from './utils/feedbackProcessor.ts';
import { processAgent } from './utils/workflow.ts';
import { saveConversation } from './utils/conversationManager.ts';
import { saveBriefOutput } from './utils/outputManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log('🚀 Starting workflow processing:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    // Input validation
    if (!briefId || !stageId) {
      console.error('❌ Missing required parameters:', { briefId, stageId });
      throw new Error('Missing required parameters: briefId and stageId are required');
    }

    console.log('📝 Processing request:', { 
      briefId, 
      stageId,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Data Validation & Preparation
    const { brief, stage } = await validateWorkflowData(supabase, briefId, stageId);
    console.log('✅ Validated workflow data:', { 
      briefId, 
      stageName: stage.name,
      timestamp: new Date().toISOString()
    });

    // 2. Feedback Processing
    let feedbackContext = null;
    if (feedbackId) {
      feedbackContext = await processFeedback(supabase, briefId, stageId, feedbackId);
      console.log('📋 Processed feedback:', { 
        feedbackId, 
        hasOriginalOutput: !!feedbackContext?.originalOutput,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Get flow steps if not provided
    let stageFlowSteps = flowSteps;
    if (!stageFlowSteps) {
      const { data: steps, error: stepsError } = await supabase
        .from('flow_steps')
        .select(`
          *,
          agents (
            id,
            name,
            description,
            temperature
          )
        `)
        .eq('flow_id', stage.flow_id)
        .order('order_index');

      if (stepsError) {
        throw new Error(`Error fetching flow steps: ${stepsError.message}`);
      }

      stageFlowSteps = steps;
    }

    if (!stageFlowSteps?.length) {
      throw new Error('No flow steps found for this stage');
    }

    // 4. Agent Processing with enhanced error handling and retries
    const outputs = [];
    for (const step of stageFlowSteps) {
      try {
        if (!step?.agents?.id) {
          console.warn('⚠️ Skipping invalid flow step:', { step });
          continue;
        }

        console.log('🤖 Processing agent step:', {
          stepId: step.id,
          agentId: step.agents.id,
          agentName: step.agents.name,
          timestamp: new Date().toISOString()
        });

        const result = await processAgent(
          supabase,
          step.agents,
          brief,
          stageId,
          step.requirements || '',
          outputs
        );
        
        if (result) {
          outputs.push(result);
          
          // 5. Conversation Management
          await saveConversation(
            supabase,
            briefId,
            stageId,
            step.agents.id,
            result,
            feedbackContext,
            step.id
          );
        }
      } catch (stepError) {
        console.error('❌ Error processing step:', {
          error: stepError,
          stepId: step.id,
          agentId: step.agents?.id,
          timestamp: new Date().toISOString()
        });
        throw stepError;
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    // 6. Save Brief Output
    await saveBriefOutput(
      supabase,
      briefId,
      stageId,
      outputs,
      stage.name,
      feedbackContext
    );

    // 7. Update processing progress
    await supabase
      .from('processing_progress')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('brief_id', briefId)
      .eq('stage_id', stageId);

    // 8. Response Handling
    return new Response(
      JSON.stringify({
        success: true,
        outputs,
        metadata: {
          processedAt: new Date().toISOString(),
          hasFeedback: !!feedbackContext,
          outputsCount: outputs.length,
          stageName: stage.name
        }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in workflow processing:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});