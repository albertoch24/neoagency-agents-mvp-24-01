import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.10"
import { PromptTemplate } from "https://esm.sh/@langchain/core/prompts@0.0.10"
import { StringOutputParser } from "https://esm.sh/@langchain/core/output_parsers@0.0.10"
import { RunnableSequence } from "https://esm.sh/@langchain/core/runnables@0.0.10"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json()

    if (!briefId || !stageId || !flowSteps) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Initialize LangChain components
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
      Process the following brief with ID ${briefId} for stage ${stageId}.
      Flow steps: {flowSteps}
      Additional context: {context}
      
      Generate a detailed response following these requirements:
      1. Analyze the brief content
      2. Consider the stage objectives
      3. Process each flow step
      4. Generate appropriate outputs
      
      Response format:
      {
        "outputs": [
          {
            "stepId": "string",
            "agent": "string",
            "outputs": [
              {
                "type": "string",
                "content": "string"
              }
            ],
            "orderIndex": number
          }
        ]
      }
    `)

    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ])

    // Get brief and stage data
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) throw briefError

    const { data: stage, error: stageError } = await supabaseClient
      .from('stages')
      .select('*')
      .eq('id', stageId)
      .single()

    if (stageError) throw stageError

    // Process with LangChain
    const result = await chain.invoke({
      flowSteps: JSON.stringify(flowSteps),
      context: JSON.stringify({ brief, stage, feedbackId })
    })

    const response = JSON.parse(result)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})