import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] Starting request processing at ${new Date().toISOString()}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    console.log(`📝 [${requestId}] Request parameters:`, { 
      briefId, 
      stageId, 
      stepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      console.error(`❌ [${requestId}] Missing required parameters:`, {
        hasBriefId: !!briefId,
        hasStageId: !!stageId,
        hasFlowSteps: Array.isArray(flowSteps),
      });
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    console.log(`🔌 [${requestId}] Initializing Supabase client`);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brief data
    console.log(`📚 [${requestId}] Fetching brief data`);
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error(`❌ [${requestId}] Error fetching brief:`, briefError);
      throw briefError;
    }

    // Process flow steps
    const outputs = [];
    for (const step of flowSteps) {
      console.log(`👤 [${requestId}] Processing agent step:`, {
        agentId: step.agent_id,
        stepId: step.id,
        orderIndex: step.order_index,
        timestamp: new Date().toISOString()
      });

      // Get agent data
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', step.agent_id)
        .single();

      if (agentError) {
        console.error(`❌ [${requestId}] Error fetching agent:`, agentError);
        throw agentError;
      }

      // Build system prompt
      const systemPrompt = `You are ${agent.name}, a specialized creative agency professional with the following skills:
${agent.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description}
  ${skill.content}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title}
- Description: ${brief.description}
- Objectives: ${brief.objectives}
- Target Audience: ${brief.target_audience}
- Budget: ${brief.budget}
- Timeline: ${brief.timeline}

Requirements for this stage:
${step.requirements}`;

      // Generate response using OpenAI
      console.log(`🤖 [${requestId}] Generating OpenAI response for agent:`, {
        agentName: agent.name,
        promptLength: systemPrompt.length,
        timestamp: new Date().toISOString()
      });

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please analyze this brief and provide your professional insights and recommendations.' }
          ],
          temperature: agent.temperature || 0.7,
        }),
      });

      if (!openAIResponse.ok) {
        console.error(`❌ [${requestId}] OpenAI API error:`, {
          status: openAIResponse.status,
          statusText: openAIResponse.statusText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const openAIData = await openAIResponse.json();
      const generatedContent = openAIData.choices[0].message.content;

      console.log(`✅ [${requestId}] Generated content for agent:`, {
        agentName: agent.name,
        contentLength: generatedContent.length,
        timestamp: new Date().toISOString()
      });

      outputs.push({
        agent: agent.name,
        stepId: step.id,
        outputs: [{
          type: 'conversational',
          content: generatedContent
        }],
        orderIndex: step.order_index,
        requirements: step.requirements
      });
    }

    // Save the output
    console.log(`💾 [${requestId}] Saving outputs to database:`, {
      outputsCount: outputs.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: stageId,
        content: {
          outputs,
          flow_name: '',
          stage_name: '',
          agent_count: outputs.length,
          feedback_used: feedbackId ? 'Feedback incorporated' : null
        },
        feedback_id: feedbackId || null
      });

    if (outputError) {
      console.error(`❌ [${requestId}] Error saving outputs:`, outputError);
      throw outputError;
    }

    console.log(`✅ [${requestId}] Successfully processed workflow stage:`, {
      briefId,
      stageId,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, outputs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ Error processing workflow stage:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});