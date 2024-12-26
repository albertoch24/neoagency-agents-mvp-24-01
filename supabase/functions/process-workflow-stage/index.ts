import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { briefId, stageId } = await req.json()
    console.log('Processing stage:', stageId, 'for brief:', briefId)
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId or stageId')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch brief details
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*, brief_outputs(*)')
      .eq('id', briefId)
      .single()

    if (briefError) {
      console.error('Error fetching brief:', briefError)
      throw briefError
    }

    if (!brief) {
      throw new Error('Brief not found')
    }

    // Clear previous outputs for this stage when reprocessing
    if (stageId !== 'kickoff') {
      console.log('Clearing previous outputs for stage:', stageId)
      const { error: deleteError } = await supabaseClient
        .from('brief_outputs')
        .delete()
        .eq('brief_id', briefId)
        .eq('stage', stageId)

      if (deleteError) {
        console.error('Error clearing previous outputs:', deleteError)
      }

      const { error: deleteConvError } = await supabaseClient
        .from('workflow_conversations')
        .delete()
        .eq('brief_id', briefId)
        .eq('stage_id', stageId)

      if (deleteConvError) {
        console.error('Error clearing previous conversations:', deleteConvError)
      }
    }

    // Fetch agents for this stage
    const { data: agents, error: agentsError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (*)
      `)

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
      throw agentsError
    }

    if (!agents || agents.length === 0) {
      console.log('No agents found, creating default response')
      await supabaseClient
        .from('brief_outputs')
        .insert({
          brief_id: briefId,
          stage: stageId,
          content: {
            agent_id: 'system',
            agent_name: 'System',
            response: 'No agents are currently available to process this stage. Please try again later or contact support.'
          }
        })

      return new Response(
        JSON.stringify({ success: true, message: 'Created default response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing responses for', agents.length, 'agents')

    // Process each agent's response
    for (const agent of agents) {
      try {
        // Prepare context from previous stages
        const { data: previousOutputs } = await supabaseClient
          .from('brief_outputs')
          .select('*')
          .eq('brief_id', briefId)
          .order('created_at', { ascending: true })

        const context = previousOutputs?.map(output => 
          `Stage ${output.stage}: ${JSON.stringify(output.content)}`
        ).join('\n') || ''

        // Prepare agent prompt with updated information
        const prompt = `You are ${agent.name}, a ${agent.description} working in an agency.
Your skills include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}

You are working on the following brief:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
Target Audience: ${brief.target_audience}
Budget: ${brief.budget}
Timeline: ${brief.timeline}

Previous stages output:
${context}

This is ${stageId === brief.current_stage ? 'an updated version of the brief' : 'a new stage'}.
Based on your role and skills, analyze the brief and previous work, then provide your professional input for the current stage (${stageId}).
If this is an updated brief, focus on what has changed and how it affects your recommendations.
Respond in a conversational way, as if you're speaking in a team meeting.`

        console.log('Calling OpenAI for agent:', agent.name)

        // Get agent's response
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: 'Please provide your analysis and recommendations.' }
          ],
          temperature: 0.7,
        })

        const response = completion.choices[0].message.content

        console.log('Received response from OpenAI for agent:', agent.name)

        // Store agent's response
        await supabaseClient
          .from('workflow_conversations')
          .insert({
            brief_id: briefId,
            stage_id: stageId,
            agent_id: agent.id,
            content: response,
            role: 'agent'
          })

        // Update brief_outputs with the combined insights
        await supabaseClient
          .from('brief_outputs')
          .insert({
            brief_id: briefId,
            stage: stageId,
            content: {
              agent_id: agent.id,
              agent_name: agent.name,
              response: response
            }
          })

        console.log('Stored response for agent:', agent.name)
      } catch (error) {
        console.error('Error processing agent:', agent.name, error)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-workflow-stage function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})