import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePaths, briefId, brand } = await req.json();

    if (!filePaths || !briefId || !brand) {
      throw new Error('Missing required parameters');
    }

    console.log('Processing documents for brief:', briefId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    });

    const processedDocs = [];

    for (const path of filePaths) {
      console.log('Processing document:', path);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('brand_documents')
        .download(path);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        continue;
      }

      const text = await fileData.text();

      const { error: insertError } = await supabase
        .from('brand_knowledge')
        .insert({
          brief_id: briefId,
          brand: brand,
          content: { text },
          type: 'initial_upload'
        });

      if (insertError) {
        console.error('Error inserting brand knowledge:', insertError);
        continue;
      }

      processedDocs.push(path);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedDocs.length} documents`,
        processedDocs 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing documents:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});