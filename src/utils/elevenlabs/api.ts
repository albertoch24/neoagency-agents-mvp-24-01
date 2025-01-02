import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Keep these functions for potential future use or local development
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

// This function is now handled by the edge function
export const generateSpeech = async () => {
  throw new Error('This function has been moved to an edge function');
};
