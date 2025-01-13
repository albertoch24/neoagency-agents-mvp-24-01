import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
    const { chunks, dimensions = 1536 } = await req.json();

    if (!chunks?.length) {
      throw new Error('No chunks provided');
    }

    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }));

    // Create embeddings for each chunk with specified dimensions
    const embeddings = await Promise.all(
      chunks.map(async (chunk: any) => {
        const response = await openai.createEmbedding({
          model: "text-embedding-3-small",
          input: chunk.content,
          dimensions: dimensions
        });
        return {
          ...chunk,
          embedding: response.data.data[0].embedding,
        };
      })
    );

    // Store embeddings in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient
      .from('document_embeddings')
      .insert(embeddings.map(e => ({
        content: e.content,
        metadata: e.metadata,
        embedding: e.embedding
      })));

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: embeddings.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});