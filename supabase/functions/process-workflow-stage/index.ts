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

    if (briefError || !brief) {
      throw new Error(`Error fetching brief: ${briefError?.message || 'Brief not found'}`);
    }

    // Get stage data
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('*, flows!inner(id, name)')
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
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

        // Get agent data
        const { data: agent, error: agentError } = await supabase
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

        if (agentError || !agent) {
          throw new Error(`Failed to fetch agent data: ${agentError?.message}`);
        }

        // Generate OpenAI prompt with enhanced context
        const systemPrompt = `You are ${agent.name}, a specialized creative agency professional with the following skills:
${agent.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title || ''}
- Brand: ${brief.brand || 'Not specified'}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
- Target Audience: ${brief.target_audience || ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}
${brief.website ? `- Website: ${brief.website}` : ''}

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
4. Proposes next steps and action items
5. Maintains consistency with previous team members' outputs
6. Includes specific examples and implementation details
7. Considers the project timeline and budget constraints
8. Provides measurable success metrics when applicable

Your response should be comprehensive, strategic, and immediately actionable.`;

        // Call OpenAI API with enhanced configuration
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Based on the brief and requirements, provide your professional analysis and recommendations.' }
            ],
            temperature: agent.temperature || 0.7,
            max_tokens: 2500,
            presence_penalty: 0.3,
            frequency_penalty: 0.3,
          }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API error: ${openAIResponse.status}`);
        }

        const aiData = await openAIResponse.json();
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