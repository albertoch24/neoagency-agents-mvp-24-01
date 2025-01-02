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
    const { text, voiceId } = await req.json();
    console.log('Generating speech for text:', text, 'with voice:', voiceId);

    // Get ElevenLabs API key from Supabase secrets
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: secretData, error: secretError } = await supabaseClient
      .from('secrets')
      .select('secret')
      .eq('name', 'ELEVEN_LABS_API_KEY')
      .maybeSingle();

    if (secretError || !secretData?.secret) {
      console.error('Error fetching ElevenLabs API key:', secretError);
      throw new Error('Failed to fetch ElevenLabs API key');
    }

    const apiKey = secretData.secret;

    // Make request to ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API error:', errorData);
      
      if (response.status === 401) {
        // Remove invalid API key
        await supabaseClient
          .from('secrets')
          .delete()
          .eq('name', 'ELEVEN_LABS_API_KEY');
          
        throw new Error('Invalid ElevenLabs API key');
      }
      
      throw new Error(errorData.detail?.message || 'Failed to generate speech');
    }

    // Get audio data and return it
    const audioData = await response.arrayBuffer();
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg'
      }
    });

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});