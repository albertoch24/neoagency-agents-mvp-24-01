import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Validate inputs
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters: briefId, stageId, and flowSteps array are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brief data
    console.log('🔍 Fetching brief data:', {
      operationId,
      briefId,
      timestamp: new Date().toISOString()
    });

    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError || !brief) {
      console.error('❌ Error fetching brief:', {
        operationId,
        error: briefError,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Error fetching brief: ${briefError?.message || 'Brief not found'}`);
    }

    // Get stage data
    console.log('🔍 Fetching stage data:', {
      operationId,
      stageId,
      timestamp: new Date().toISOString()
    });

    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('*, flows!inner(id, name)')
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
      console.error('❌ Error fetching stage:', {
        operationId,
        error: stageError,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Error fetching stage: ${stageError?.message || 'Stage not found'}`);
    }

    // Process each agent
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

        // Get agent data with retry logic
        let agent = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!agent && retryCount < maxRetries) {
          const { data, error } = await supabase
            .from('agents')
            .select(`
              id,
              name,
              description,
              temperature,
              skills (
                id,
                name,
                type,
                content,
                description
              )
            `)
            .eq('id', step.agent_id)
            .single();

          if (error) {
            console.warn(`⚠️ Retry ${retryCount + 1} failed for agent fetch:`, {
              operationId,
              error,
              agentId: step.agent_id,
              timestamp: new Date().toISOString()
            });
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          } else {
            agent = data;
            break;
          }
        }

        if (!agent) {
          throw new Error(`Failed to fetch agent data after ${maxRetries} attempts`);
        }

        console.log('✅ Retrieved agent data:', {
          operationId,
          agentId: agent.id,
          agentName: agent.name,
          skillsCount: agent.skills?.length || 0,
          timestamp: new Date().toISOString()
        });

        // Generate OpenAI prompt
        const systemPrompt = `You are ${agent.name}, a specialized creative agency professional with the following skills:
${agent.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title || ''}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
${brief.target_audience ? `- Target Audience: ${brief.target_audience}` : ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}

Requirements for this stage:
${step.requirements || 'No specific requirements provided'}

${outputs.length > 0 ? `
Consider previous outputs from team members:
${outputs.map(output => `
${output.agent}: ${output.content}
`).join('\n')}
` : ''}

Provide a detailed, actionable response that:
1. Analyzes the brief through your professional lens
2. Offers specific recommendations based on your skills
3. Addresses the stage requirements directly
4. Proposes next steps and action items`;

        console.log('🤖 Generating OpenAI response:', {
          operationId,
          agentId: agent.id,
          agentName: agent.name,
          timestamp: new Date().toISOString()
        });

        // Call OpenAI API
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
              { role: 'user', content: 'Based on the brief and requirements, provide your professional analysis and recommendations.' }
            ],
            temperature: agent.temperature || 0.7,
          }),
        });

        if (!openAIResponse.ok) {
          const errorText = await openAIResponse.text();
          console.error('❌ OpenAI API error:', {
            operationId,
            status: openAIResponse.status,
            error: errorText,
            timestamp: new Date().toISOString()
          });
          throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
        }

        const aiData = await openAIResponse.json();
        const generatedContent = aiData.choices[0].message.content;

        console.log('✅ Successfully generated response:', {
          operationId,
          agentId: agent.id,
          agentName: agent.name,
          contentLength: generatedContent.length,
          timestamp: new Date().toISOString()
        });

        outputs.push({
          agent: agent.name,
          requirements: step.requirements,
          outputs: [
            {
              content: generatedContent,
              type: 'conversational'
            }
          ],
          stepId: agent.id,
          orderIndex: outputs.length
        });

      } catch (stepError) {
        console.error('❌ Error processing step:', {
          operationId,
          error: stepError,
          stepId: step.id,
          agentId: step.agent_id,
          timestamp: new Date().toISOString()
        });
        // Continue with next step instead of failing the entire process
        continue;
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    console.log('✅ Successfully processed all steps:', {
      operationId,
      outputsCount: outputs.length,
      timestamp: new Date().toISOString()
    });

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