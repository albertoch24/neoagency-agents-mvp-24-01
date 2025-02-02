import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"

console.log("Edge Function Starting: process-workflow-stage-langchain");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Request received:", new Date().toISOString());
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !openAiKey) {
      throw new Error('Missing required environment variables')
    }

    // Parse request body
    const { briefId, stageId, flowSteps, feedbackId } = await req.json()
    
    console.log("Request parameters:", { 
      briefId, 
      stageId, 
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId 
    });

    if (!briefId || !stageId || !flowSteps) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    console.log("Supabase client initialized");

    // Initialize OpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: openAiKey,
    })
    console.log("OpenAI model initialized");

    // Create prompt template
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

    // Create chain
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

    console.log("Data fetched successfully");

    // Process with LangChain
    const result = await chain.invoke({
      flowSteps: JSON.stringify(flowSteps),
      context: JSON.stringify({ brief, stage, feedbackId })
    })

    console.log("Processing completed successfully");

    // Parse and return result
    const response = JSON.parse(result)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

console.log("Edge Function Setup Completed");