import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateWorkflowData } from './utils/dataValidator.ts';
import { processFeedback } from './utils/feedbackProcessor.ts';
import { processAgent } from './utils/workflow.ts';
import { saveConversation } from './utils/conversationManager.ts';
import { saveBriefOutput } from './utils/outputManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    console.log('Received request:', { briefId, stageId, flowStepsCount: flowSteps?.length, hasFeedback: !!feedbackId });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    // 1. Data Validation & Preparation
    const { brief, stage } = await validateWorkflowData(briefId, stageId);
    console.log('Validated workflow data:', { briefId, stageName: stage.name });

    // 2. Feedback Processing
    let feedbackContext = null;
    if (feedbackId) {
      feedbackContext = await processFeedback(briefId, stageId, feedbackId);
      console.log('Processed feedback:', { feedbackId, hasOriginalOutput: !!feedbackContext.originalOutput });
    }

    // 3. Agent Processing
    const outputs = [];
    for (const step of flowSteps) {
      if (!step || !step.agent_id) {
        console.error('Invalid flow step:', step);
        continue;
      }

      try {
        const result = await processAgent(
          step.agents,
          brief,
          stageId,
          step.requirements,
          outputs,
          feedbackId
        );
        
        if (result) {
          outputs.push(result);
          
          // 4. Conversation Management
          await saveConversation(
            briefId,
            stageId,
            step.agents.id,
            result.outputs[0].content,
            feedbackContext
          );
        }
      } catch (stepError) {
        console.error('Error processing step:', {
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id
        });
        continue;
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    // 5. Output Management
    await saveBriefOutput(
      briefId,
      stageId,
      outputs,
      stage.name,
      feedbackContext
    );

    // 6. Response Handling
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in workflow processing:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});