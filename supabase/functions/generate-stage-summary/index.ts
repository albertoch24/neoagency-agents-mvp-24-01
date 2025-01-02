import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { stageId } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all outputs for this stage
    const { data: outputs, error: fetchError } = await supabaseClient
      .from('brief_outputs')
      .select('content')
      .eq('stage_id', stageId);

    if (fetchError) {
      throw new Error(`Error fetching outputs: ${fetchError.message}`);
    }

    if (!outputs?.length) {
      return new Response(
        JSON.stringify({ summary: "No outputs found for this stage." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract all summaries from the outputs
    const summaries = outputs.map(output => {
      if (output.content.outputs) {
        return output.content.outputs
          .map((agentOutput: any) => {
            if (Array.isArray(agentOutput.outputs)) {
              return agentOutput.outputs
                .map((output: any) => output.content || '')
                .join('\n');
            }
            return '';
          })
          .join('\n');
      }
      return output.content.response || '';
    }).filter(Boolean);

    // Use OpenAI to generate a comprehensive summary
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional summarizer. Create a concise, clear summary of the following workflow outputs. Focus on key points and actionable insights.'
          },
          {
            role: 'user',
            content: `Please summarize these workflow outputs:\n\n${summaries.join('\n\n')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const openAIResponse = await response.json();
    const summary = openAIResponse.choices[0].message.content;

    // Update the brief_outputs table with the new summary
    const { error: updateError } = await supabaseClient
      .from('brief_outputs')
      .update({ stage_summary: summary })
      .eq('stage_id', stageId);

    if (updateError) {
      throw new Error(`Error updating summary: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});