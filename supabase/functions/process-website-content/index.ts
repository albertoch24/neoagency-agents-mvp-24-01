import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { RecursiveCharacterTextSplitter } from "https://esm.sh/@langchain/text@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, content } = await req.json();
    if (!brand || !content) {
      throw new Error('Brand and content are required');
    }

    console.log('Processing website content for brand:', brand);

    // Initialize text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitText(content);
    console.log('Generated chunks:', chunks);

    const supabase = createClient("https://szufbafdhfwqclyixdpd.supabase.co", "your-supabase-key");

    const { data, error } = await supabase
      .from('website_content')
      .insert([{ brand, content: chunks }]);

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ message: 'Content processed successfully', data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing website content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
