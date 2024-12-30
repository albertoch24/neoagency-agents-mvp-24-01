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
    const { agentId, input } = await req.json()
    
    if (!agentId || !input) {
      throw new Error('Missing required parameters: agentId and input must be provided')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch agent details and skills
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (*)
      `)
      .eq('id', agentId)
      .single()

    if (agentError) {
      console.error('Error fetching agent:', agentError)
      throw new Error('Failed to fetch agent details')
    }
    if (!agent) throw new Error('Agent not found')

    // Initialize OpenAI with the latest SDK
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Prepare system message with agent description and skills
    const systemMessage = `You are an AI assistant with the following description: ${agent.description}
    
Your skills and knowledge include:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n') || 'No specific skills defined yet.'}

Please use these skills and knowledge to provide accurate and helpful responses.`

    console.log('Calling OpenAI API with system message:', systemMessage)
    console.log('User input:', input)

    // Call OpenAI API with the latest SDK syntax
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Fixed model name
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content

    console.log('Received response from OpenAI:', response)

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in agent-response function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})