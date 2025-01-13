import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, metadata = {}, dimensions = 1536 } = await req.json();

    console.log('Processing document:', {
      contentLength: content?.length,
      metadataKeys: Object.keys(metadata),
      dimensions
    });

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

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

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});