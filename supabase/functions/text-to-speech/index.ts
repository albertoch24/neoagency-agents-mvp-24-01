import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log Supabase connection details (without sensitive info)
    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'));
    console.log('Service Role Key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    const { text, voiceId } = await req.json();
    console.log('Generating speech for text:', text, 'with voice:', voiceId);

    // Get ElevenLabs API key from Supabase secrets with better error handling
    const { data: secretData, error: secretError } = await supabaseClient
      .from('secrets')
      .select('secret')
      .eq('name', 'ELEVEN_LABS_API_KEY')
      .maybeSingle();

    if (secretError) {
      console.error('Error fetching ElevenLabs API key:', secretError);
      throw new Error('Failed to fetch ElevenLabs API key');
    }

    if (!secretData?.secret) {
      console.error('ElevenLabs API key not found in secrets');
      throw new Error('ElevenLabs API key not found');
    }

    const apiKey = secretData.secret;

    // Validate the API key by testing it
    const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!testResponse.ok) {
      console.error('Invalid ElevenLabs API key - test request failed:', testResponse.status);
      // Remove invalid API key
      await supabaseClient
        .from('secrets')
        .delete()
        .eq('name', 'ELEVEN_LABS_API_KEY');
      throw new Error('Invalid ElevenLabs API key');
    }

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