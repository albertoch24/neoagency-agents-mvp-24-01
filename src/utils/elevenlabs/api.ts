import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  console.log('API key successfully retrieved');
  return apiKey;
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  console.log('Validating ElevenLabs API key...');
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': key
      }
    });
    const isValid = response.ok;
    console.log('API key validation result:', isValid);
    return isValid;
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
  console.log('Invalid API key removed successfully');
};

export const getVoiceId = async (): Promise<string> => {
  // Default voice ID (Bella)
  return '21m00Tcm4TlvDq8ikWAM';
};