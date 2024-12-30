import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from './utils/database.ts'
import { createOpenAIClient, createAgentPrompt } from './utils/openai.ts'
import { 
  fetchBriefDetails, 
  fetchStageDetails,
  saveConversation,
  saveBriefOutput 
} from './utils/database.ts'

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

    const supabaseClient = createSupabaseClient()
    const openai = createOpenAIClient()

    // Fetch brief and stage details
    const brief = await fetchBriefDetails(supabaseClient, briefId)
    const stage = await fetchStageDetails(supabaseClient, stageId)

    console.log('Processing flow steps:', stage.flows?.flow_steps)

    // Process each agent in the flow
    const outputs = []
    for (const step of (stage.flows?.flow_steps || [])) {
      const agent = step.agents
      if (!agent) continue

      console.log('Processing agent:', agent.name)

      // Create personalized prompt for the agent
      const prompt = createAgentPrompt(agent, agent.skills || [], brief, stage.name)

      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt }
        ],
        temperature: 0.7,
      })

      const response = completion.choices[0].message.content
      console.log('Received response from OpenAI for agent:', agent.name)

      // Save the conversation
      await saveConversation(supabaseClient, briefId, stageId, agent.id, response)

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
    await saveBriefOutput(supabaseClient, briefId, stageId, stage.name, outputs)

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