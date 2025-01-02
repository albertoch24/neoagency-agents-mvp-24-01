import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TextToSpeechButtonProps {
  text: string;
  convId: string;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
}

export const TextToSpeechButton = ({
  text,
  convId,
  isPlaying,
  onPlayStateChange,
  onAudioElement
}: TextToSpeechButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTextToSpeech = async () => {
    try {
      if (isPlaying) {
        console.log('Stopping current playback...');
        onPlayStateChange(false);
        onAudioElement(null);
        return;
      }

      setIsLoading(true);
      console.log('Starting text-to-speech process...');

      // Fetch API key from Supabase
      console.log('Fetching ElevenLabs API key from Supabase...');
      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'ELEVEN_LABS_API_KEY')
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching API key from Supabase:', secretError);
        toast.error('Failed to fetch ElevenLabs API key');
        return;
      }

      const apiKey = secretData?.secret?.trim();

      if (!apiKey) {
        console.error('No API key found in Supabase');
        toast.error('ElevenLabs API key not found. Please add it in settings.');
        return;
      }

      console.log('Making request to ElevenLabs API...');
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pFZP5JQG7iQjIQuC4Bku', {
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
        let errorMessage = 'Failed to generate speech';
        try {
          const errorData = await response.json();
          console.error('ElevenLabs API error details:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          
          if (response.status === 401) {
            console.log('Invalid API key detected, removing from Supabase...');
            await supabase
              .from('secrets')
              .delete()
              .eq('name', 'ELEVEN_LABS_API_KEY');
            
            toast.error('Invalid API key. Please add a valid ElevenLabs API key in settings.');
            return;
          } else if (response.status === 429) {
            errorMessage = 'API rate limit exceeded. Please try again later.';
            console.error('Rate limit exceeded for ElevenLabs API');
          } else {
            errorMessage = errorData.detail?.message || 'Unknown error';
            console.error('Unexpected error from ElevenLabs API:', errorData);
          }
        } catch (e) {
          console.error('Error parsing ElevenLabs error response:', e);
        }
        toast.error(errorMessage);
        return;
      }

      console.log('Successfully received audio response from ElevenLabs');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('Creating audio element...');
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('Audio playback completed');
        onPlayStateChange(false);
        onAudioElement(null);
        URL.revokeObjectURL(audioUrl); // Clean up URL when done
        console.log('Audio resources cleaned up');
      };
      
      onAudioElement(audio);
      audio.play();
      onPlayStateChange(true);
      console.log('Audio playback started');

    } catch (error) {
      console.error('Unexpected error in text-to-speech process:', error);
      toast.error('Failed to generate speech. Please try again.');
      onPlayStateChange(false);
      onAudioElement(null);
    } finally {
      setIsLoading(false);
      console.log('Text-to-speech process completed');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTextToSpeech}
      disabled={isLoading}
    >
      {isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};