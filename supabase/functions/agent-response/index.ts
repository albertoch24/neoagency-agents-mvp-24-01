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
    const elevenLabsApiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    
    // Get text response from OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
      }),
    });

    const openAIData = await openAIResponse.json();
    const textResponse = openAIData.choices[0].message.content;

    // If agent has a voice_id, generate audio
    let audioUrl = null;
    if (agent.voice_id && elevenLabsApiKey) {
      try {
        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${agent.voice_id}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: textResponse,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });

        if (voiceResponse.ok) {
          const audioBlob = await voiceResponse.blob();
          const base64Audio = await blobToBase64(audioBlob);
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        }
      } catch (error) {
        console.error('Error generating voice response:', error);
      }
    }

    return new Response(JSON.stringify({ 
      response: textResponse,
      audioUrl
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

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}