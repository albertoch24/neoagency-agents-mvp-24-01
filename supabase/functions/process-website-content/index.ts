import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { RecursiveCharacterTextSplitter } from "https://esm.sh/langchain@0.0.200/text/splitters";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteContent, brand, briefId } = await req.json();
    
    if (!websiteContent) {
      throw new Error('No content provided');
    }

    console.log('Processing website content for brand:', brand);

    // Initialize text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Split text into chunks
    const chunks = await textSplitter.createDocuments([websiteContent]);
    console.log(`Split content into ${chunks.length} chunks`);

    // Initialize OpenAI for embeddings
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each chunk
    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.pageContent,
      });

      const [{ embedding }] = embeddingResponse.data;

      // Store in documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          content: chunk.pageContent,
          metadata: {
            brand,
            briefId,
            source: 'website',
            chunk_index: chunks.indexOf(chunk),
            total_chunks: chunks.length
          },
          embedding
        });

      if (insertError) {
        console.error('Error inserting document:', insertError);
        throw insertError;
      }
    }

    // Store raw content in brand_knowledge
    const { error: brandKnowledgeError } = await supabase
      .from('brand_knowledge')
      .insert({
        brand,
        brief_id: briefId,
        content: { raw: websiteContent },
        type: 'website_content'
      });

    if (brandKnowledgeError) {
      console.error('Error storing brand knowledge:', brandKnowledgeError);
      throw brandKnowledgeError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${chunks.length} chunks of content`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing website content:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});