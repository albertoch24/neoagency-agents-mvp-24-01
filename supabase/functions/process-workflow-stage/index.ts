import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

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
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Fetch brief details
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) throw briefError

    // Fetch stage with its associated flow and steps
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

    if (stageError) throw stageError

    console.log('Processing flow steps:', stage.flows?.flow_steps)

    // Process each agent in the flow
    const outputs = []
    for (const step of (stage.flows?.flow_steps || [])) {
      const agent = step.agents
      if (!agent) continue

      console.log('Processing agent:', agent.name)

      // Create personalized prompt for the agent based on their skills and description
      const agentPrompt = `You are ${agent.name}, an expert with the following profile:
${agent.description}

Your skills include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.description}`).join('\n') || 'No specific skills listed'}

Please analyze the following brief and provide your expert perspective based on your role and skills:

Brief Title: ${brief.title}
Description: ${brief.description || 'Not provided'}
Objectives: ${brief.objectives || 'Not provided'}
Target Audience: ${brief.target_audience || 'Not provided'}
Budget: ${brief.budget || 'Not provided'}
Timeline: ${brief.timeline || 'Not provided'}

Please provide a detailed analysis and recommendations from your specific perspective as ${agent.name}.`

      // Get response from OpenAI
      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional creative agency expert.' },
          { role: 'user', content: agentPrompt }
        ],
      })

      const response = completion.data.choices[0].message?.content || ''
      console.log('Received response from OpenAI for agent:', agent.name)

      // Save the conversation
      const { error: conversationError } = await supabaseClient
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agent.id,
          content: response
        })

      if (conversationError) throw conversationError

      // Add to outputs array
      outputs.push({
        agent: agent.name,
        outputs: [{
          text: `Agent Analysis`,
          content: response
        }]
      })
    }

    // Save the final output
    const { error: outputError } = await supabaseClient
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content: {
          stage_name: stage.name,
          outputs: outputs
        }
      })

    if (outputError) throw outputError

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
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})