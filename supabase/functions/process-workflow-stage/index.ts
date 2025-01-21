import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    console.log('🚀 Processing workflow stage:', { briefId, stageId, stepsCount: flowSteps?.length });

    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brief data
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) throw briefError;

    // Process each flow step sequentially
    const outputs = [];
    for (const step of flowSteps) {
      console.log('Processing step:', { agentId: step.agent_id, requirements: step.requirements });

      // Get agent data
      const { data: agent } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', step.agent_id)
        .single();

      if (!agent) {
        console.error('Agent not found:', step.agent_id);
        continue;
      }

      // Build system prompt using agent skills
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
${step.requirements}

Provide a detailed, actionable response that:
1. Analyzes the brief through your professional lens
2. Offers specific recommendations based on your skills
3. Addresses the stage requirements directly
4. Proposes next steps and action items`;

      // Generate response using OpenAI
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
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
      }

      const aiData = await openAIResponse.json();
      const generatedContent = aiData.choices[0].message.content;

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

      console.log('Generated output for agent:', {
        agentName: agent.name,
        contentLength: generatedContent.length
      });
    }

    // Save the output
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

    if (outputError) throw outputError;

    console.log('✅ Successfully processed workflow stage:', {
      briefId,
      stageId,
      outputsCount: outputs.length
    });

    return new Response(
      JSON.stringify({ success: true, outputs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing workflow stage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});