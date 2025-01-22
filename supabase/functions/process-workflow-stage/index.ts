import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBriefData, getPreviousOutput } from "./utils/briefHandler.ts";
import { getStageData } from "./utils/stageHandler.ts";
import { getAgentData, generateSystemPrompt } from "./utils/agentHandler.ts";
import { generateOpenAIResponse } from "./utils/openaiHandler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = crypto.randomUUID();
  console.log('🚀 Starting workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString()
  });

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    console.log('📝 Processing request:', {
      operationId,
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const brief = await getBriefData(supabase, briefId);
    const stage = await getStageData(supabase, stageId);
    const previousOutput = await getPreviousOutput(supabase, briefId, stageId);

    const outputs = [];
    for (const step of flowSteps) {
      try {
        console.log('🤖 Processing agent step:', {
          operationId,
          stepId: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index,
          timestamp: new Date().toISOString()
        });

        const agent = await getAgentData(supabase, step.agent_id);
        const systemPrompt = generateSystemPrompt(agent, brief, previousOutput, step.requirements);
        const aiData = await generateOpenAIResponse(systemPrompt, agent.temperature);
        const generatedContent = aiData.choices[0].message.content;

        outputs.push({
          agent: agent.name,
          requirements: step.requirements,
          outputs: [
            {
              content: generatedContent,
              type: 'conversational'
            }
          ],
          stepId: step.agent_id,
          orderIndex: step.order_index
        });

      } catch (stepError) {
        console.error('❌ Error processing step:', {
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

    return new Response(
      JSON.stringify({ success: true, outputs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});