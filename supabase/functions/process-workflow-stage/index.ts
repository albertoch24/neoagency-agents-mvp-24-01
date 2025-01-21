import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from './utils/cors.ts';
import { validateRequest } from './utils/requestHandler.ts';
import { validateWorkflowData } from './utils/dataValidator.ts';
import { processFeedback } from './utils/feedbackProcessor.ts';
import { processAgent } from './utils/workflow.ts';
import { saveConversation } from './utils/conversationManager.ts';
import { saveBriefOutput } from './utils/outputManager.ts';

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] Starting workflow processing at ${new Date().toISOString()}`);

  try {
    // 1. Initial Request Handling
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { briefId, stageId, flowSteps, feedbackId } = await validateRequest(req);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Data Validation & Preparation
    const { brief, stage } = await validateWorkflowData(supabase, briefId, stageId);

    // 3. Feedback Processing
    let feedbackContext = null;
    if (feedbackId) {
      feedbackContext = await processFeedback(supabase, briefId, stageId, feedbackId);
      console.log(`✅ [${requestId}] Feedback processed:`, {
        feedbackId,
        hasOriginalOutput: !!feedbackContext.originalOutput,
        timestamp: new Date().toISOString()
      });
    }

    // 4. Agent Processing
    const outputs = [];
    for (const step of flowSteps) {
      const result = await processAgent(
        supabase,
        step.agents,
        brief,
        stageId,
        step.requirements,
        outputs,
        feedbackId
      );
      
      if (result) {
        outputs.push(result);
        
        // 5. Conversation Management
        await saveConversation(
          supabase,
          briefId,
          stageId,
          step.agents.id,
          result.outputs[0].content,
          feedbackContext
        );
      }
    }

    // 6. Output Management
    await saveBriefOutput(
      supabase,
      briefId,
      stageId,
      outputs,
      feedbackContext
    );

    // 7. Response Handling
    console.log(`✅ [${requestId}] Workflow processing completed:`, {
      briefId,
      stageId,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metadata: {
          requestId,
          processedAt: new Date().toISOString(),
          hasFeedback: !!feedbackContext,
          outputsCount: outputs.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ Error in workflow processing:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});