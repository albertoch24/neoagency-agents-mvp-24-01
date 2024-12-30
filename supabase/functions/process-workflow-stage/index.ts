import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './utils/cors.ts'

serve(async (req) => {
  // Handle CORS
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

    // Get the stage details
    const { data: stage, error: stageError } = await supabaseClient
      .from('stages')
      .select('*, flows(*)')
      .eq('id', stageId)
      .single()

    if (stageError) throw stageError
    if (!stage) throw new Error('Stage not found')

    console.log('Found stage:', stage)

    // Get the flow steps if a flow is associated
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
    for (const step of flowSteps) {
      const agent = step.agents
      if (!agent) continue

      console.log('Processing step with agent:', agent.name)

      // Create a workflow conversation entry
      const { error: convError } = await supabaseClient
        .from('workflow_conversations')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          agent_id: agent.id,
          content: `Using ${agent.name} with skills: ${agent.skills?.map(s => s.name).join(', ')}`
        })

      if (convError) throw convError
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
          timestamp: new Date().toISOString()
        }
      })

    if (outputError) throw outputError

    // Update brief current stage
    const { error: briefError } = await supabaseClient
      .from('briefs')
      .update({ current_stage: stage.name })
      .eq('id', briefId)

    if (briefError) throw briefError

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