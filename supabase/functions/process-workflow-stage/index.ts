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
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId or stageId')
    }

    console.log('Processing workflow stage:', { briefId, stageId })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Get the stage details with associated flow
    const { data: stage, error: stageError } = await supabaseClient
      .from('stages')
      .select('*, flows(*)')
      .eq('id', stageId)
      .single()

    if (stageError) throw stageError
    if (!stage) throw new Error('Stage not found')

    console.log('Found stage:', stage)

    // Get the brief details
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) throw briefError
    if (!brief) throw new Error('Brief not found')

    // Get the flow steps with agents and their skills
    let flowSteps = []
    if (stage.flow_id) {
      const { data: steps, error: stepsError } = await supabaseClient
        .from('flow_steps')
        .select(`
          *,
          agents (
            id,
            name,
            description,
            skills (*)
          )
        `)
        .eq('flow_id', stage.flow_id)
        .order('order_index', { ascending: true })

      if (stepsError) throw stepsError
      flowSteps = steps || []
    }

    console.log('Flow steps:', flowSteps)

    // Process each flow step sequentially
    const processedOutputs = []
    for (const step of flowSteps) {
      const agent = step.agents
      if (!agent) continue

      console.log('Processing step with agent:', agent.name)

      // Prepare agent context from skills
      const agentSkills = agent.skills?.map((skill: any) => 
        `${skill.name}: ${skill.content}`
      ).join('\n') || ''

      // Prepare system message with agent description and skills
      const systemMessage = `You are ${agent.name}, an AI agent with the following description: ${agent.description}

Your skills and expertise include:
${agentSkills}

Based on these skills and the brief information provided, generate specific outputs that fulfill the requirements.
Focus on providing actionable, concrete deliverables.
Your response should be detailed and specific to your role and expertise.`

      // Prepare user message with brief details and requirements
      const userMessage = `Brief Details:
Title: ${brief.title}
Description: ${brief.description || 'No description provided'}
Objectives: ${brief.objectives || 'No objectives provided'}
Target Audience: ${brief.target_audience || 'No target audience specified'}
Budget: ${brief.budget || 'No budget specified'}
Timeline: ${brief.timeline || 'No timeline specified'}

Required Outputs: ${step.outputs?.map((output: any) => output.text).join('\n') || 'No specific outputs required'}
Requirements: ${step.requirements || 'No specific requirements provided'}

Please provide detailed outputs based on the brief and your expertise.
Be specific and actionable in your response.`

      console.log('Sending request to OpenAI with messages:', { systemMessage, userMessage })

      // Call OpenAI for agent's response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      })

      const agentResponse = completion.choices[0].message.content

      console.log('Received response from OpenAI:', agentResponse)

      // Create a workflow conversation entry
      const { error: convError } = await supabaseClient
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agent.id,
          content: agentResponse
        })

      if (convError) throw convError

      // Add to processed outputs
      processedOutputs.push({
        agent: agent.name,
        requirements: step.requirements,
        outputs: step.outputs?.map((output: any) => ({
          text: output.text,
          content: agentResponse
        }))
      })
    }

    // Create stage output
    const { error: outputError } = await supabaseClient
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stage.name,
        stage_id: stageId,
        content: {
          stage_name: stage.name,
          flow_name: stage.flows?.name,
          agent_count: flowSteps.length,
          outputs: processedOutputs
        }
      })

    if (outputError) throw outputError

    // Update brief current stage
    const { error: briefUpdateError } = await supabaseClient
      .from('briefs')
      .update({ current_stage: stage.name })
      .eq('id', briefId)

    if (briefUpdateError) throw briefUpdateError

    console.log('Successfully processed stage:', stage.name)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})