import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    console.log('Processing workflow stage request...')

    // Get environment variables
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const langSmithApiKey = Deno.env.get('LANGCHAIN_API_KEY')

    if (!openAiKey) {
      console.error("Missing OPENAI_API_KEY")
      throw new Error('Missing required environment variable: OPENAI_API_KEY')
    }

    // Initialize LangChain tracer if API key is available
    let tracer
    if (langSmithApiKey) {
      console.log("Initializing LangChain tracer...")
      tracer = new LangChainTracer({
        projectName: "workflow-stage-processing",
        apiKey: langSmithApiKey,
        apiUrl: "https://api.smith.langchain.com"
      });
      console.log("LangChain tracer initialized successfully")
    } else {
      console.log("No LANGCHAIN_API_KEY provided, skipping tracer initialization")
    }

    // Initialize ChatOpenAI
    const model = new ChatOpenAI({
      openAIApiKey: openAiKey,
      temperature: 0.7,
      modelName: "gpt-4",
    })

    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful AI assistant. Please help with the following request:
      {input}
      
      Please provide a detailed and helpful response.`
    )

    // Create processing chain
    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser()
    ])

    // Parse request body
    const requestData = await req.json()
    console.log('Request data:', requestData)

    // Process the input
    console.log('Processing input with LangChain...')
    const result = await chain.invoke({
      input: requestData.input || "No input provided"
    })

    console.log('Processing completed successfully')

    // Return the result
    return new Response(
      JSON.stringify({ response: result }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})