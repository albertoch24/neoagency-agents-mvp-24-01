import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence } from "@langchain/core/runnables"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://*.lovableproject.com',
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
      headers: corsHeaders
    });
  }

  try {
    console.log("Processing request...");
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !openAiKey) {
      console.error("Missing required environment variables");
      throw new Error('Missing required environment variables')
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
      throw new Error('Missing required parameters')
    }

    // LangChain processing logic
    const model = new ChatOpenAI({
      openAIApiKey: openAiKey,
      temperature: 0.7,
    });

    const prompt = new PromptTemplate({
      template: "Given the brief ID {briefId} and stage ID {stageId}, process the following flow steps: {flowSteps}",
      inputVariables: ["briefId", "stageId", "flowSteps"],
    });

    const runnable = new RunnableSequence([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const outputs = await runnable.invoke({
      briefId,
      stageId,
      flowSteps,
    });

    return new Response(
      JSON.stringify({
        success: true,
        outputs
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(
      JSON.stringify({
        error: error.message
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
