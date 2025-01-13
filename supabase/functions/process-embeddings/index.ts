import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Initializing OpenAI client with API key:', {
      keyLength: openAiKey.length,
      keyStart: openAiKey.substring(0, 3),
      keyEnd: openAiKey.substring(openAiKey.length - 4)
    });

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    const { text } = await req.json();
    console.log('Processing embeddings for text:', {
      textLength: text.length,
      preview: text.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    console.log('Embeddings generated successfully:', {
      dimensions: embedding.data[0].embedding.length,
      usage: embedding.usage,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        embedding: embedding.data[0].embedding,
        usage: embedding.usage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing embeddings:', {
      error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});