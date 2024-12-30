import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './utils/cors.ts'
import { createOpenAIClient, generateAgentResponse } from './utils/openai.ts'
import { 
  createSupabaseClient, 
  fetchBriefDetails,
  fetchStageDetails,
  saveConversation,
  saveBriefOutput
} from './utils/database.ts'

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

    // Initialize clients
    const supabaseClient = createSupabaseClient()
    const openai = createOpenAIClient()

    // Fetch brief details
    const brief = await fetchBriefDetails(supabaseClient, briefId)
    console.log('Found brief:', brief)

    // Fetch stage with its associated flow and steps
    const stage = await fetchStageDetails(supabaseClient, stageId)
    console.log('Found stage with flow:', stage)

    // Update brief's current stage
    const { error: updateError } = await supabaseClient
      .from('briefs')
      .update({ current_stage: stage.name })
      .eq('id', briefId)

    if (updateError) {
      console.error('Error updating brief stage:', updateError)
      throw updateError
    }

    // Process each agent in the flow
    const outputs = []
    const flowSteps = stage.flows?.flow_steps || []
    console.log('Processing flow steps:', flowSteps)

    for (const step of flowSteps) {
      const agent = step.agents
      if (!agent) {
        console.log('No agent found for step:', step)
        continue
      }

      console.log('Processing agent:', agent.name)

      // Create personalized prompt for the agent
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

      try {
        // Get response from OpenAI
        const response = await generateAgentResponse(openai, agentPrompt)
        console.log('Received response from OpenAI for agent:', agent.name)

        // Save the conversation
        await saveConversation(supabaseClient, briefId, stageId, agent.id, response)

        // Add to outputs array
        outputs.push({
          agent: agent.name,
          outputs: [{
            text: response
          }]
        })
      } catch (error) {
        console.error('Error processing agent:', agent.name, error)
        throw error
      }
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
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})