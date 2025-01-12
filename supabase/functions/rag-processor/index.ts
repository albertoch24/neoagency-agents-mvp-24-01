import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "@langchain/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, stage, content, type } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const model = new ChatOpenAI({ openAIApiKey });

    // Process content using RAG
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
    });

    // Generate embeddings and store brand knowledge
    const processedContent = await model.predict(
      `Analyze the following content for brand ${brand} in stage ${stage}: ${content}`
    );

    // Store the processed content
    const { data, error } = await supabase
      .from('brand_knowledge')
      .insert({
        brand,
        content: {
          original: content,
          processed: processedContent,
        },
        type,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
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