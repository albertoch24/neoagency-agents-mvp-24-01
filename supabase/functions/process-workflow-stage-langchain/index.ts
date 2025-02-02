import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"
import { Client as LangSmithClient } from "langsmith"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

console.log("Edge Function Starting: process-workflow-stage-langchain");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log("Processing request...");
    
    // Get environment variables
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const langSmithApiKey = Deno.env.get('LANGCHAIN_API_KEY')

    if (!openAiKey) {
      console.error("Missing OPENAI_API_KEY");
      throw new Error('Missing required environment variable: OPENAI_API_KEY')
    }

    // Initialize LangSmith client if API key is available
    let lsClient;
    if (langSmithApiKey) {
      lsClient = new LangSmithClient({ apiKey: langSmithApiKey });
      console.log("LangSmith client initialized");
    }

    // Parse request body
    const { briefId, stageId, flowSteps, feedbackId } = await req.json()

    console.log("Request parameters:", {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    if (!briefId || !stageId || !flowSteps) {
      console.error("Missing required parameters");
      throw new Error('Missing required parameters: briefId, stageId, and flowSteps are required')
    }

    // Initialize LangChain
    const model = new ChatOpenAI({
      openAIApiKey: openAiKey,
      temperature: 0.7,
      modelName: "gpt-4"
    });

    const prompt = new PromptTemplate({
      template: "Given the brief ID {briefId} and stage ID {stageId}, process the following flow steps: {flowSteps}",
      inputVariables: ["briefId", "stageId", "flowSteps"],
    });

    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    console.log("Starting LangChain processing...");
    const outputs = await chain.invoke({
      briefId,
      stageId,
      flowSteps: JSON.stringify(flowSteps),
    });

    console.log("Processing completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        outputs
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error("Error in edge function:", {
      error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
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