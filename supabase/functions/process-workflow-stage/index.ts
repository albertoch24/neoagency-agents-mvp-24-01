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
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      console.error('❌ Invalid input parameters:', { briefId, stageId, flowStepsCount: flowSteps?.length });
      throw new Error('Missing or invalid required parameters');
    }

    console.log('📝 Processing request:', { 
      briefId, 
      stageId, 
      flowStepsCount: flowSteps?.length,
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
        hasOriginalOutput: !!feedbackContext.originalOutput,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Agent Processing with enhanced error handling
    const outputs = [];
    for (const step of flowSteps) {
      try {
        if (!step?.agent_id) {
          console.warn('⚠️ Skipping invalid flow step:', { step });
          continue;
        }

        console.log('🤖 Processing agent step:', {
          stepId: step.id,
          agentId: step.agent_id,
          timestamp: new Date().toISOString()
        });

        const result = await processAgent(
          supabase,
          { id: step.agent_id },
          brief,
          stageId,
          step.requirements || '',
          outputs
        );
        
        if (result) {
          outputs.push(result);
          
          // 4. Conversation Management
          await saveConversation(
            supabase,
            briefId,
            stageId,
            step.agent_id,
            result.outputs[0].content,
            feedbackContext
          );
        }
      } catch (stepError) {
        console.error('❌ Error processing step:', {
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id,
          timestamp: new Date().toISOString()
        });
        throw stepError;
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    // 5. Output Management
    await saveBriefOutput(
      supabase,
      briefId,
      stageId,
      outputs,
      stage.name,
      feedbackContext
    );

    // 6. Response Handling with proper headers
    return new Response(
      JSON.stringify({
        success: true,
        outputs,
        metadata: {
          processedAt: new Date().toISOString(),
          hasFeedback: !!feedbackContext,
          outputsCount: outputs.length
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