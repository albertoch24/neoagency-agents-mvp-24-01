
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  console.log('🚀 Starting workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief details
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError || !brief) {
      console.error('Error fetching brief:', briefError);
      throw new Error('Brief not found');
    }

    // Fetch current stage details
    const { data: currentStage, error: stageError } = await supabase
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          description
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError || !currentStage) {
      console.error('Error fetching stage:', stageError);
      throw new Error('Stage not found');
    }

    // Process each flow step with OpenAI
    const outputs = [];
    const previousOutputs = [];
    
    // Sort flow steps by order_index to ensure proper processing sequence
    const sortedFlowSteps = [...flowSteps].sort((a, b) => a.order_index - b.order_index);
    
    for (const step of sortedFlowSteps) {
      console.log('Processing flow step:', {
        stepId: step.id,
        agentId: step.agent_id,
        orderIndex: step.order_index,
        timestamp: new Date().toISOString()
      });

      // Get agent details
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
        console.error('Error fetching agent:', agentError);
        continue;
      }

      // Build the system prompt based on agent role and skills
      const systemPrompt = `You are ${agent.name}, a specialized creative agency professional.
${agent.description || ''}

Your expertise includes:
${agent.skills?.map(skill => `- ${skill.name}: ${skill.description || ''}`).join('\n') || 'No specific skills listed.'}

You are processing a brief for a project. Your role is to provide specific insights, recommendations, 
and actionable steps based on your expertise.`;

      // Build the user prompt with brief details and requirements
      const userPrompt = `Brief Title: ${brief.title || 'No title provided'}
Brief Description: ${brief.description || 'No description provided'}
Brief Objectives: ${brief.objectives || 'No objectives provided'}
${brief.target_audience ? `Target Audience: ${brief.target_audience}` : ''}
${brief.budget ? `Budget: ${brief.budget}` : ''}
${brief.timeline ? `Timeline: ${brief.timeline}` : ''}

Your specific task and requirements:
${step.requirements || 'Provide a detailed response based on your expertise.'}

${previousOutputs.length > 0 ? `
Previous outputs from team members to consider:
${previousOutputs.map(output => `
${output.agent} said:
${output.content}
`).join('\n')}
` : ''}

Respond with a comprehensive, detailed, and actionable analysis. Be specific and provide concrete recommendations.`;

      console.log('Calling OpenAI API for agent:', {
        agentName: agent.name,
        systemPromptPreview: systemPrompt.substring(0, 100) + '...',
        userPromptPreview: userPrompt.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      try {
        // Call OpenAI API to generate response
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: agent.temperature || 0.7,
            max_tokens: 1500,
          }),
        });

        if (!openAIResponse.ok) {
          const errorText = await openAIResponse.text();
          console.error('OpenAI API error:', {
            status: openAIResponse.status,
            statusText: openAIResponse.statusText,
            errorText,
            timestamp: new Date().toISOString()
          });
          throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
        }

        const aiData = await openAIResponse.json();
        const generatedContent = aiData.choices[0].message.content;

        console.log('Successfully received OpenAI response for agent:', {
          agentName: agent.name,
          contentLength: generatedContent.length,
          contentPreview: generatedContent.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        });

        const stepOutput = {
          stepId: step.agent_id,
          agent: agent.name,
          requirements: step.requirements,
          outputs: [{
            content: generatedContent,
            type: 'conversational'
          }],
          orderIndex: step.order_index
        };

        // Save workflow conversation
        const { error: conversationError } = await supabase
          .from('workflow_conversations')
          .insert({
            brief_id: briefId,
            stage_id: stageId,
            agent_id: agent.id,
            content: generatedContent,
            output_type: 'conversational',
            flow_step_id: step.id
          });

        if (conversationError) {
          console.error('Error saving conversation:', conversationError);
        }

        outputs.push(stepOutput);
        
        // Add to previous outputs for context in next steps
        previousOutputs.push({
          agent: agent.name,
          content: generatedContent
        });
        
      } catch (openAIError) {
        console.error('Error processing with OpenAI:', {
          error: openAIError,
          agentName: agent.name,
          timestamp: new Date().toISOString()
        });
        
        // Create a fallback output that indicates the error
        const errorOutput = {
          stepId: step.agent_id,
          agent: agent.name,
          requirements: step.requirements,
          outputs: [{
            content: `Error generating content with OpenAI: ${openAIError.message}. Please try again later.`,
            type: 'conversational'
          }],
          orderIndex: step.order_index
        };
        
        outputs.push(errorOutput);
      }
    }

    if (outputs.length === 0) {
      throw new Error('No outputs were generated from any agent');
    }

    // Save the combined output
    const { error: outputError } = await supabase
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: currentStage.name,
        content: {
          stage_name: currentStage.name,
          flow_name: currentStage.flows?.name,
          agent_count: sortedFlowSteps.length,
          outputs: outputs.map(output => ({
            agent: output.agent,
            requirements: output.requirements,
            outputs: output.outputs,
            stepId: output.stepId,
            orderIndex: output.orderIndex
          }))
        },
        feedback_id: feedbackId || null,
        content_format: 'structured'
      });

    if (outputError) {
      console.error('Error saving output:', outputError);
      throw outputError;
    }

    // Update brief status
    const { error: briefUpdateError } = await supabase
      .from('briefs')
      .update({ 
        current_stage: stageId,
        status: 'in_progress'
      })
      .eq('id', briefId);

    if (briefUpdateError) {
      console.error('Error updating brief:', briefUpdateError);
      throw briefUpdateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metrics: {
          operationId,
          processedAt: new Date().toISOString(),
          agentsProcessed: outputs.length,
          hasFeedback: !!feedbackId
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
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
        error: error.message || 'An unexpected error occurred',
        details: error.stack,
        context: {
          operationId,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
