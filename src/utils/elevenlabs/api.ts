import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const fetchElevenLabsApiKey = async () => {
  console.log('Fetching ElevenLabs API key from Supabase...');
  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('secret')
    .eq('name', 'ELEVEN_LABS_API_KEY')
    .maybeSingle();

  if (secretError) {
    console.error('Error fetching API key from Supabase:', secretError);
    throw new Error('Failed to fetch ElevenLabs API key');
  }

  const apiKey = secretData?.secret?.trim();
  if (!apiKey) {
    console.log('No API key found in Supabase');
    throw new Error('No ElevenLabs API key found');
  }

  return apiKey;
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': key
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

export const removeInvalidApiKey = async () => {
  console.log('Removing invalid API key from Supabase...');
  const { error } = await supabase
    .from('secrets')
    .delete()
    .eq('name', 'ELEVEN_LABS_API_KEY');

  if (error) {
    console.error('Error removing API key:', error);
    throw new Error('Failed to remove invalid API key');
  }
};

export const generateSpeech = async (text: string, voiceId: string, apiKey: string, retryCount = 0): Promise<Response> => {
  console.log(`Making request to ElevenLabs API (attempt ${retryCount + 1})...`);
  
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
    console.error('ElevenLabs API error details:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });

    if (response.status === 401) {
      await removeInvalidApiKey();
      throw new Error('Invalid API key');
    }

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      console.log(`Rate limit exceeded, retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return generateSpeech(text, voiceId, apiKey, retryCount + 1);
    }

    throw new Error(errorData.detail?.message || 'Unknown error');
  }

  return response;
};