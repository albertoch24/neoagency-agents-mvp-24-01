import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { briefId, stageId } = await req.json();
    console.log("Generating stage summary for:", { briefId, stageId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all outputs for this stage
    const { data: outputs, error: outputsError } = await supabase
      .from('workflow_conversations')
      .select('content, output_type')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .eq('output_type', 'summary');

    if (outputsError) {
      throw outputsError;
    }

    if (!outputs || outputs.length === 0) {
      throw new Error('No outputs found for summary generation');
    }

    // Combine all summaries
    const combinedContent = outputs.map(o => o.content).join('\n\n');

    // Generate summary using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional summarizer. Create a concise summary of the following content, highlighting the key points and insights.'
          },
          {
            role: 'user',
            content: combinedContent
          }
        ],
      }),
    });

    const data = await response.json();
    const summary = data.choices[0].message.content;

    // Save the summary
    const { error: updateError } = await supabase
      .from('brief_outputs')
      .update({ stage_summary: summary })
      .eq('brief_id', briefId)
      .eq('stage', stageId);

    if (updateError) {
      throw updateError;
    }

    console.log("Stage summary generated successfully");

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-stage-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});