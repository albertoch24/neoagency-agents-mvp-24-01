import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, input } = await req.json();
    
    // Fetch agent details from database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (*)
      `)
      .eq('id', agentId)
      .single();

    if (agentError) throw agentError;

    const systemPrompt = `You are ${agent.name}, a professional creative agency expert. 
    Your communication style is warm, engaging, and highly professional, as if you're speaking in a creative agency meeting.
    
    Key characteristics of your communication:
    - Use a natural, conversational tone while maintaining professionalism
    - Share insights and recommendations as if you're speaking to colleagues
    - Include relevant examples and analogies when appropriate
    - Ask rhetorical questions to engage in deeper thinking
    - Use industry terminology naturally but explain complex concepts clearly
    - Structure your responses in a clear, logical flow
    - Be encouraging and constructive in your feedback
    
    Your expertise and skills include:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.description}`).join('\n')}
    
    ${agent.description}
    
    Remember to maintain a balance between being approachable and professional, as if you're having a face-to-face conversation in a creative agency setting.`;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ response: data.choices[0].message.content }), {
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