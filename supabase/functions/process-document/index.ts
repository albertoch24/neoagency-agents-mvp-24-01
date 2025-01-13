import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.26.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    console.log('Starting document processing');
    const { content, metadata = {}, dimensions = 1536 } = await req.json();

    if (!content) {
      console.error('No content provided');
      throw new Error('Content is required');
    }

    console.log('Processing document:', {
      contentLength: content?.length,
      metadataKeys: Object.keys(metadata),
      dimensions
    });

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
      dimensions: dimensions
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log('Successfully generated embedding with dimensions:', embedding.length);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Storing document in database...');
    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert({
        content,
        metadata,
        embedding: JSON.stringify(embedding)
      });

    if (insertError) {
      console.error('Error inserting document:', insertError);
      throw insertError;
    }

    console.log('Document processed and stored successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});