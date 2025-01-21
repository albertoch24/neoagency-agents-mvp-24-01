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
    console.log(`📝 [${requestId}] Stage Processing Details:`, { 
      briefId, 
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    // Get stage details for debugging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: stageData, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (*)
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError) {
      console.error(`❌ [${requestId}] Error fetching stage:`, {
        error: stageError,
        stageId,
        timestamp: new Date().toISOString()
      });
      throw stageError;
    }

    console.log(`📋 [${requestId}] Stage details:`, {
      stageName: stageData.name,
      hasFlow: !!stageData.flows,
      flowId: stageData.flow_id,
      flowStepsCount: stageData.flows?.flow_steps?.length,
      timestamp: new Date().toISOString()
    });

    // Detailed validation
    const validationErrors = [];
    if (!briefId) validationErrors.push('Missing briefId');
    if (!stageId) validationErrors.push('Missing stageId');
    if (!Array.isArray(flowSteps)) validationErrors.push('flowSteps must be an array');
    if (Array.isArray(flowSteps) && flowSteps.length === 0) validationErrors.push('flowSteps array is empty');

    if (validationErrors.length > 0) {
      console.error(`❌ [${requestId}] Validation errors:`, {
        errors: validationErrors,
        stageName: stageData.name,
        flowId: stageData.flow_id,
        timestamp: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationErrors 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get brief data
    console.log(`📚 [${requestId}] Fetching brief data`);
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error(`❌ [${requestId}] Error fetching brief:`, {
        error: briefError,
        briefId,
        stageName: stageData.name,
        timestamp: new Date().toISOString()
      });
      throw briefError;
    }

    // Process flow steps
    const outputs = [];
    for (const step of flowSteps) {
      console.log(`👤 [${requestId}] Processing agent step:`, {
        agentId: step.agent_id,
        stepId: step.id,
        orderIndex: step.order_index,
        stageName: stageData.name,
        timestamp: new Date().toISOString()
      });

      // Get agent data
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', step.agent_id)
        .single();

      if (agentError) {
        console.error(`❌ [${requestId}] Error fetching agent:`, {
          error: agentError,
          agentId: step.agent_id,
          stageName: stageData.name,
          timestamp: new Date().toISOString()
        });
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
- Stage: ${stageData.name}

Requirements for this stage:
${step.requirements}`;

      // Generate response using OpenAI
      console.log(`🤖 [${requestId}] Generating OpenAI response for agent:`, {
        agentName: agent.name,
        promptLength: systemPrompt.length,
        stageName: stageData.name,
        timestamp: new Date().toISOString()
      });

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
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
          stageName: stageData.name,
          timestamp: new Date().toISOString()
        });
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const openAIData = await openAIResponse.json();
      const generatedContent = openAIData.choices[0].message.content;

      console.log(`✅ [${requestId}] Generated content for agent:`, {
        agentName: agent.name,
        contentLength: generatedContent.length,
        stageName: stageData.name,
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
      stageName: stageData.name,
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
          flow_name: stageData.flows?.name || '',
          stage_name: stageData.name,
          agent_count: outputs.length,
          feedback_used: feedbackId ? 'Feedback incorporated' : null
        },
        feedback_id: feedbackId || null
      });

    if (outputError) {
      console.error(`❌ [${requestId}] Error saving outputs:`, {
        error: outputError,
        stageName: stageData.name,
        timestamp: new Date().toISOString()
      });
      throw outputError;
    }

    // Create workflow conversations
    for (const output of outputs) {
      const { error: conversationError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: flowSteps.find(s => s.id === output.stepId)?.agent_id,
          content: output.outputs[0].content,
          flow_step_id: output.stepId,
          version: 1
        });

      if (conversationError) {
        console.error(`❌ [${requestId}] Error saving conversation:`, {
          error: conversationError,
          stageName: stageData.name,
          timestamp: new Date().toISOString()
        });
        throw conversationError;
      }
    }

    console.log(`✅ [${requestId}] Successfully processed workflow stage:`, {
      briefId,
      stageId,
      stageName: stageData.name,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, outputs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Error processing workflow stage:`, {
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