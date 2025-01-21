import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRetry } from "./utils/retry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE = 3;

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

    // Initialize Supabase client with logging
    console.log(`🔌 [${requestId}] Initializing Supabase client`);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brief data with error handling
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
        timestamp: new Date().toISOString()
      });
      throw briefError;
    }

    console.log(`✅ [${requestId}] Brief data fetched successfully:`, {
      briefTitle: brief.title,
      briefStatus: brief.status,
      timestamp: new Date().toISOString()
    });

    // Process flow steps in chunks with detailed logging
    const outputs = [];
    const totalChunks = Math.ceil(flowSteps.length / CHUNK_SIZE);
    
    for (let i = 0; i < flowSteps.length; i += CHUNK_SIZE) {
      const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
      const chunk = flowSteps.slice(i, i + CHUNK_SIZE);
      
      console.log(`🔄 [${requestId}] Processing chunk ${chunkIndex}/${totalChunks}:`, {
        startIndex: i,
        endIndex: Math.min(i + CHUNK_SIZE, flowSteps.length),
        stepsInChunk: chunk.length,
        timestamp: new Date().toISOString()
      });

      const chunkOutputs = await Promise.all(chunk.map(async (step) => {
        return await withRetry(async () => {
          console.log(`👤 [${requestId}] Processing agent step:`, {
            agentId: step.agent_id,
            stepId: step.id,
            orderIndex: step.order_index,
            timestamp: new Date().toISOString()
          });

          // Get agent data with logging
          const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('*, skills(*)')
            .eq('id', step.agent_id)
            .single();

          if (agentError) {
            console.error(`❌ [${requestId}] Error fetching agent:`, {
              error: agentError,
              agentId: step.agent_id,
              timestamp: new Date().toISOString()
            });
            throw agentError;
          }

          console.log(`✅ [${requestId}] Agent data fetched:`, {
            agentName: agent.name,
            skillsCount: agent.skills?.length,
            timestamp: new Date().toISOString()
          });

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

          // Generate response using OpenAI with retry and logging
          console.log(`🤖 [${requestId}] Generating OpenAI response for agent:`, {
            agentName: agent.name,
            promptLength: systemPrompt.length,
            timestamp: new Date().toISOString()
          });

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
                console.error(`❌ [${requestId}] OpenAI API error:`, {
                  status: response.status,
                  statusText: response.statusText,
                  timestamp: new Date().toISOString()
                });
                throw new Error(`OpenAI API error: ${response.statusText}`);
              }

              return response.json();
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (error, attempt) => {
                console.log(`🔄 [${requestId}] Retry attempt ${attempt} for OpenAI call:`, {
                  error: error.message,
                  timestamp: new Date().toISOString()
                });
              }
            }
          );

          const generatedContent = openAIResponse.choices[0].message.content;
          console.log(`✅ [${requestId}] Generated content for agent:`, {
            agentName: agent.name,
            contentLength: generatedContent.length,
            timestamp: new Date().toISOString()
          });

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
            console.log(`🔄 [${requestId}] Retry attempt ${attempt} for step processing:`, {
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });
      }));

      outputs.push(...chunkOutputs.filter(Boolean));
      console.log(`✅ [${requestId}] Chunk ${chunkIndex}/${totalChunks} processed successfully:`, {
        outputsGenerated: chunkOutputs.length,
        timestamp: new Date().toISOString()
      });
    }

    // Save the output with retry and logging
    console.log(`💾 [${requestId}] Saving outputs to database:`, {
      outputsCount: outputs.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

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

      if (outputError) {
        console.error(`❌ [${requestId}] Error saving outputs:`, {
          error: outputError,
          timestamp: new Date().toISOString()
        });
        throw outputError;
      }
    }, {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        console.log(`🔄 [${requestId}] Retry attempt ${attempt} for saving output:`, {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

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
    console.error(`❌ [${requestId}] Error processing workflow stage:`, {
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