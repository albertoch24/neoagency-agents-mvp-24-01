import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

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

    if (agentError) throw agentError
    if (!agent) throw new Error('Agent not found')

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Prepare system message with agent description and skills
    const systemMessage = `You are an AI assistant with the following description: ${agent.description}
    
Your skills and knowledge include:
${agent.skills.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}

Please use these skills and knowledge to provide accurate and helpful responses.`

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
    })

    const response = completion.data.choices[0].message?.content

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})