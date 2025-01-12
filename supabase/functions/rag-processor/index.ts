import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "@langchain/openai";
import { SupabaseVectorStore } from "https://esm.sh/@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    const model = new ChatOpenAI({ openAIApiKey });

    // Initialize vector store
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
    });

    // Search for relevant documents
    const relevantDocs = await vectorStore.similaritySearch(query, 5);

    // Generate response using the model
    const response = await model.predict(
      `Context: ${context || ''}\n\nRelevant information: ${
        relevantDocs.map(doc => doc.pageContent).join('\n')
      }\n\nQuery: ${query}`
    );

    return new Response(
      JSON.stringify({
        response,
        relevantDocs,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});