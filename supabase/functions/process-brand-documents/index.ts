import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentBody {
  brand: string;
  briefId: string;
  content: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const { brand, briefId, content, metadata } = await req.json() as ProcessDocumentBody;

    console.log("Processing document for brand:", brand, "briefId:", briefId);

    // Split content into chunks (max 1000 tokens per chunk)
    const chunks = splitIntoChunks(content, 1000);
    console.log(`Split content into ${chunks.length} chunks`);

    for (const chunk of chunks) {
      // Generate embedding for chunk
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      console.log("Generated embedding for chunk");

      // Store chunk and embedding
      const { error: docError } = await supabaseClient
        .from('documents')
        .insert({
          content: chunk,
          embedding: embedding.data[0].embedding,
          metadata: {
            ...metadata,
            brand,
            brief_id: briefId,
            chunk_index: chunks.indexOf(chunk),
            total_chunks: chunks.length
          }
        });

      if (docError) {
        console.error("Error storing document:", docError);
        throw docError;
      }

      // Store in brand_knowledge for quick access
      const { error: knowledgeError } = await supabaseClient
        .from('brand_knowledge')
        .insert({
          brand,
          brief_id: briefId,
          content: {
            text: chunk,
            metadata: metadata
          },
          type: 'document'
        });

      if (knowledgeError) {
        console.error("Error storing brand knowledge:", knowledgeError);
        throw knowledgeError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Document processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

function splitIntoChunks(text: string, maxTokens: number): string[] {
  // Simple splitting by sentences first
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // Rough estimation: 1 token ≈ 4 characters
    if ((currentChunk.length + sentence.length) / 4 > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}