import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRetry } from "./utils/retry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE = 3; // Processa 3 step alla volta

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

    // Process flow steps in chunks
    const outputs = [];
    for (let i = 0; i < flowSteps.length; i += CHUNK_SIZE) {
      const chunk = flowSteps.slice(i, i + CHUNK_SIZE);
      console.log(`Processing chunk ${i / CHUNK_SIZE + 1}:`, {
        start: i,
        end: Math.min(i + CHUNK_SIZE, flowSteps.length)
      });

      const chunkOutputs = await Promise.all(chunk.map(async (step) => {
        return await withRetry(async () => {
          console.log('Processing step:', { agentId: step.agent_id, requirements: step.requirements });

          // Get agent data
          const { data: agent } = await supabase
            .from('agents')
            .select('*, skills(*)')
            .eq('id', step.agent_id)
            .single();

          if (!agent) {
            console.error('Agent not found:', step.agent_id);
            return null;
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

          // Generate response using OpenAI with retry
          const openAIResponse = await withRetry(
            async () => {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

              if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
              }

              return response.json();
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (error, attempt) => {
                console.log(`Retry attempt ${attempt} for OpenAI call:`, error);
              }
            }
          );

          const generatedContent = openAIResponse.choices[0].message.content;

          return {
            agent: agent.name,
            stepId: step.id,
            outputs: [{
              type: 'conversational',
              content: generatedContent
            }],
            orderIndex: step.order_index,
            requirements: step.requirements
          };
        }, {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} for step processing:`, error);
          }
        });
      }));

      outputs.push(...chunkOutputs.filter(Boolean));
    }

    // Save the output with retry
    await withRetry(async () => {
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
    }, {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt} for saving output:`, error);
      }
    });

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