import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { briefId, stageId } = await req.json()
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId or stageId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing workflow stage:', { briefId, stageId })

    // Get stage information
    const { data: stage, error: stageError } = await supabaseClient
      .from('stages')
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (
            *,
            agents (
              id,
              name,
              description,
              skills (*)
            )
          )
        )
      `)
      .eq('id', stageId)
      .single()

    if (stageError) {
      throw stageError
    }

    // Get brief information
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) {
      throw briefError
    }

    // Update brief with current stage
    const { error: briefUpdateError } = await supabaseClient
      .from('briefs')
      .update({ current_stage: stageId })
      .eq('id', briefId)

    if (briefUpdateError) {
      throw briefUpdateError
    }

    // Delete existing outputs for this stage and brief
    const { error: deleteError } = await supabaseClient
      .from('brief_outputs')
      .delete()
      .match({ brief_id: briefId, stage: stageId })

    if (deleteError) {
      throw deleteError
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Process each agent in the flow
    const flow = stage.flows;
    const flowSteps = flow?.flow_steps || [];
    
    console.log('Processing flow steps:', flowSteps);

    for (const step of flowSteps) {
      const agent = step.agents;
      if (!agent) continue;

      console.log('Processing agent:', agent.name);

      // Prepare agent skills and context
      const skills = agent.skills || [];
      const skillsDescription = skills.map((skill: any) => 
        `${skill.name}: ${skill.content}`
      ).join('\n');

      // Create system message with agent description and skills
      const systemMessage = `You are ${agent.name}, an AI agent with the following description: ${agent.description}

Your skills and expertise include:
${skillsDescription}

You are working on a brief with these details:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
Target Audience: ${brief.target_audience}
Budget: ${brief.budget}
Timeline: ${brief.timeline}

Current Stage: ${stage.name}

Based on your specific role and expertise, analyze this brief and provide your professional insights and recommendations.
Be specific about how your skills will be applied to meet the brief's objectives.
Respond in a conversational way, as if you're speaking in a team meeting.`;

      console.log('Calling OpenAI with system message:', systemMessage);

      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage }
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;

      console.log('Received response from OpenAI for agent:', agent.name);

      // Save the conversation
      const { error: conversationError } = await supabaseClient
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agent.id,
          content: response
        });

      if (conversationError) {
        console.error('Error saving conversation:', conversationError);
        throw conversationError;
      }

      // Save the output
      const { error: outputError } = await supabaseClient
        .from('brief_outputs')
        .insert({
          brief_id: briefId,
          stage: stageId,
          stage_id: stageId,
          content: {
            stage_name: stage.name,
            outputs: [{
              agent: agent.name,
              outputs: [{
                text: `Agent Analysis`,
                content: response
              }]
            }]
          }
        });

      if (outputError) {
        console.error('Error saving output:', outputError);
        throw outputError;
      }
    }

    return new Response(
      JSON.stringify({ message: 'Stage processed successfully' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error processing workflow stage:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})