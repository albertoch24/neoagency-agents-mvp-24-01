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
  const handleTextToSpeech = async () => {
    try {
      if (isPlaying) {
        onPlayStateChange(false);
        onAudioElement(null);
        return;
      }

      console.log('Fetching ElevenLabs API key from Supabase...');
      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'ELEVEN_LABS_API_KEY')
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching API key:', secretError);
        toast.error('Failed to fetch ElevenLabs API key');
        return;
      }

      if (!secretData?.secret) {
        console.error('ElevenLabs API key not found in secrets');
        toast.error('ElevenLabs API key not found. Please add it in settings.');
        return;
      }

      const apiKey = secretData.secret.trim();
      if (!apiKey) {
        toast.error('Invalid ElevenLabs API key format');
        return;
      }

      console.log('Making request to ElevenLabs API...');
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', {
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
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate speech';
        try {
          const errorData = await response.json();
          console.error('ElevenLabs API error:', errorData);
          
          if (response.status === 401) {
            errorMessage = 'Invalid ElevenLabs API key. Please check your API key in settings.';
          } else if (response.status === 429) {
            errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.';
          } else {
            errorMessage = `ElevenLabs API error: ${errorData.detail?.message || 'Unknown error'}`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        toast.error(errorMessage);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        onPlayStateChange(false);
        onAudioElement(null);
        URL.revokeObjectURL(audioUrl); // Clean up the URL when done
      };
      
      onAudioElement(audio);
      audio.play();
      onPlayStateChange(true);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      toast.error('Failed to generate speech. Please check your ElevenLabs API key.');
      onPlayStateChange(false);
      onAudioElement(null);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTextToSpeech}
    >
      {isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};