import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, dimensions = 1536 } = await req.json();

    if (!content) {
      throw new Error('No content provided');
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not found');
    }

    const configuration = new Configuration({
      apiKey: openAIKey,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      }
    });

    const openai = new OpenAIApi(configuration);

    console.log('Generating embedding for content:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      model: 'text-embedding-3-small',
      timestamp: new Date().toISOString()
    });

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: content,
      dimensions: dimensions
    });

    const [{ embedding }] = embeddingResponse.data.data;

    console.log('Successfully generated embedding:', {
      dimensions: embedding.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ embedding }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in process-embeddings:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});