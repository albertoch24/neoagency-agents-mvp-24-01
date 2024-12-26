import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) {
      console.error('Error fetching brief:', briefError)
      throw briefError
    }

    if (!brief) {
      throw new Error('Brief not found')
    }

    // Clear previous outputs and conversations
    console.log('Clearing previous outputs and conversations for brief:', briefId, 'stage:', stageId)
    
    await clearPreviousData(supabaseClient, briefId, stageId)

    // Fetch non-paused agents with their skills
    const { data: agents, error: agentsError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (
          id,
          name,
          type,
          description,
          content
        )
      `)
      .eq('is_paused', false) // Only fetch non-paused agents

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
      throw agentsError
    }

    if (!agents || agents.length === 0) {
      console.log('No active agents found, creating default response')
      await createDefaultResponse(supabaseClient, briefId, stageId)
      return new Response(
        JSON.stringify({ success: true, message: 'Created default response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    console.log('Processing responses for', agents.length, 'active agents')

    // Process each agent's response
    for (const agent of agents) {
      try {
        await processAgentResponse(supabaseClient, openai, agent, brief, stageId)
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

async function clearPreviousData(supabaseClient: any, briefId: string, stageId: string) {
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

async function createDefaultResponse(supabaseClient: any, briefId: string, stageId: string) {
  await supabaseClient
    .from('brief_outputs')
    .insert({
      brief_id: briefId,
      stage: stageId,
      content: {
        agent_id: 'system',
        agent_name: 'System',
        response: 'No active agents are currently available to process this stage. Please try again later or contact support.'
      }
    })
}

async function processAgentResponse(supabaseClient: any, openai: any, agent: any, brief: any, stageId: string) {
  const formattedSkills = agent.skills?.map((skill: any) => ({
    name: skill.name,
    type: skill.type,
    description: skill.description,
    content: skill.content
  })) || []

  const prompt = createPrompt(agent, formattedSkills, brief, stageId)
  
  console.log('Calling OpenAI for agent:', agent.name)
  console.log('Agent skills:', formattedSkills)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Please provide your analysis and recommendations for this stage.' }
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content

  console.log('Received response from OpenAI for agent:', agent.name)

  await storeAgentResponse(supabaseClient, agent, response, brief.id, stageId, formattedSkills)
}

function createPrompt(agent: any, formattedSkills: any[], brief: any, stageId: string) {
  return `You are ${agent.name}, ${agent.description || 'an AI agent'}.

Your expertise and skills include:
${formattedSkills.map((skill: any) => `
- ${skill.name} (${skill.type}):
  ${skill.description || 'No description provided'}
  Details: ${skill.content}
`).join('\n')}

You are working on the following brief:
Title: ${brief.title}
Description: ${brief.description || 'No description provided'}
Objectives: ${brief.objectives || 'No objectives provided'}
Target Audience: ${brief.target_audience || 'No target audience specified'}
Budget: ${brief.budget || 'No budget specified'}
Timeline: ${brief.timeline || 'No timeline specified'}

Current Stage: ${stageId}

Based on your specific role, skills, and expertise described above, provide your professional analysis and recommendations for this stage of the project.
Be specific about how your skills will be applied to meet the brief's objectives.
Respond in a conversational way, as if you're speaking in a team meeting.`
}

async function storeAgentResponse(
  supabaseClient: any, 
  agent: any, 
  response: string, 
  briefId: string, 
  stageId: string, 
  formattedSkills: any[]
) {
  await supabaseClient
    .from('workflow_conversations')
    .insert({
      brief_id: briefId,
      stage_id: stageId,
      agent_id: agent.id,
      content: response
    })

  await supabaseClient
    .from('brief_outputs')
    .insert({
      brief_id: briefId,
      stage: stageId,
      content: {
        agent_id: agent.id,
        agent_name: agent.name,
        agent_description: agent.description,
        agent_skills: formattedSkills,
        response: response
      }
    })

  console.log('Stored response for agent:', agent.name)
}