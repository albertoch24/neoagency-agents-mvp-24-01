import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Loading process-embeddings function");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting embeddings process:', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('API Key verification:', {
      exists: !!openAiKey,
      length: openAiKey.length,
      startsWithSk: openAiKey.startsWith('sk-'),
      timestamp: new Date().toISOString()
    });

    if (!openAiKey.startsWith('sk-')) {
      console.error('Invalid OpenAI API key format:', {
        keyLength: openAiKey.length,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid OpenAI API key format');
    }

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    const { content } = await req.json();

    if (!content) {
      console.error('No content provided for embedding');
      throw new Error('Content is required');
    }

    console.log('Generating embedding for content:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
      encoding_format: "float",
    });

    console.log('Embedding generated successfully:', {
      dimensions: embedding.data[0].embedding.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        embedding: embedding.data[0].embedding,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in process-embeddings:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});