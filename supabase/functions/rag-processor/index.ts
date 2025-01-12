import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai";
import { SupabaseVectorStore } from "https://esm.sh/langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "https://esm.sh/langchain/embeddings/openai";

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
    const { query, briefId, context } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    
    // Initialize vector store
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    });

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(query, 3);

    // Use ChatOpenAI to generate response
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      openAIApiKey,
      temperature: 0.7,
    });

    const response = await model.call([
      {
        role: "system",
        content: `You are a helpful assistant that provides relevant information based on the context. 
                 Use the following retrieved documents to inform your response: ${JSON.stringify(relevantDocs)}`,
      },
      {
        role: "user",
        content: query,
      },
    ]);

    return new Response(JSON.stringify({ 
      response: response.content,
      relevantDocs 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});