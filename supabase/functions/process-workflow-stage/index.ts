import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      .select('*')
      .eq('id', stageId)
      .single()

    if (stageError) {
      throw stageError
    }

    // Update brief with current stage
    const { error: briefError } = await supabaseClient
      .from('briefs')
      .update({ current_stage: stageId })
      .eq('id', briefId)

    if (briefError) {
      throw briefError
    }

    // Delete existing outputs for this stage and brief
    const { error: deleteError } = await supabaseClient
      .from('brief_outputs')
      .delete()
      .match({ brief_id: briefId, stage: stageId })

    if (deleteError) {
      throw deleteError
    }

    // Get the first available agent to start the conversation
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .limit(1)
      .single()

    if (agentError) {
      console.error('Error fetching agent:', agentError)
      throw agentError
    }

    // Create initial workflow conversation
    const { error: conversationError } = await supabaseClient
      .from('workflow_conversations')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        agent_id: agent.id,
        content: `Starting ${stage.name} stage. I'll help guide this process.`
      })

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      throw conversationError
    }

    // Create new output
    const { error: outputError } = await supabaseClient
      .from('brief_outputs')
      .insert({
        brief_id: briefId,
        stage: stageId,
        stage_id: stageId,
        content: {
          stage_name: stage.name,
          outputs: [] // Initial empty outputs
        }
      })

    if (outputError) {
      throw outputError
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