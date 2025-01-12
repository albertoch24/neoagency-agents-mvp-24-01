import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { SupabaseVectorStore } from "https://esm.sh/@langchain/community@0.3.24/vectorstores/supabase";
import { OpenAIEmbeddings } from "https://esm.sh/@langchain/openai@0.0.14";

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
    console.log('Starting RAG processor');
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    console.log('Received request body:', body);

    // Validate request body
    if (!body || typeof body.query !== 'string' || !body.query.trim()) {
      console.error('Invalid or missing query in request body');
      throw new Error('A valid query string is required');
    }

    const query = body.query.trim();
    console.log('Processing query:', query);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured in environment variables');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Initializing OpenAI embeddings');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      modelName: "text-embedding-3-small"
    });

    console.log('Creating vector store');
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    });

    console.log('Performing similarity search');
    const results = await vectorStore.similaritySearch(query, 5);
    console.log(`Found ${results.length} relevant documents`);

    console.log('Processing results with OpenAI');
    const openai = new OpenAI({ apiKey: openAIApiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides information based on the given context."
        },
        {
          role: "user",
          content: `Based on the following context, please answer this question: ${query}\n\nContext: ${results.map(doc => doc.pageContent).join('\n\n')}`
        }
      ]
    });

    const answer = response.choices[0].message.content;
    console.log('Successfully generated response');

    return new Response(
      JSON.stringify({
        answer,
        sources: results.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata
        }))
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in RAG processor:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
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