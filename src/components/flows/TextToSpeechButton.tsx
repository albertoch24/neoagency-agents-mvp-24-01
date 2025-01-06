import { useState, useCallback } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioManager } from "@/utils/elevenlabs/audio";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const audioManager = new AudioManager();

  const handleTextToSpeech = useCallback(async () => {
    try {
      console.log('TextToSpeech button clicked', { isPlaying, text: text.substring(0, 50) + '...' });
      
      if (isPlaying) {
        console.log('Stopping current playback...');
        onPlayStateChange(false);
        onAudioElement(null);
        return;
      }

      setIsLoading(true);
      console.log('Starting text-to-speech process...');

      // Using Rachel's voice ID as default
      const voiceId = "21m00Tcm4TlvDq8ikWAM";
      
      console.log('Fetching ElevenLabs API key...');
      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'ELEVEN_LABS_API_KEY')
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching API key:', secretError);
        throw new Error('Failed to fetch ElevenLabs API key');
      }

      if (!secretData?.secret) {
        console.log('No API key found, showing dialog');
        setShowApiKeyDialog(true);
        throw new Error('ElevenLabs API key not found');
      }

      console.log('Making request to ElevenLabs API...');
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': secretData.secret
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        console.error('ElevenLabs API error:', response.status, response.statusText);
        if (response.status === 401) {
          console.log('Invalid API key, showing dialog');
          setShowApiKeyDialog(true);
          throw new Error('Invalid ElevenLabs API key');
        }
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log('Successfully received audio response');
      
      console.log('Creating audio element...');
      const audio = await audioManager.playAudio(audioBlob);
      
      audio.onended = () => {
        console.log('Audio playback completed');
        onPlayStateChange(false);
        onAudioElement(null);
        audioManager.cleanup();
        console.log('Audio resources cleaned up');
      };
      
      onAudioElement(audio);
      audio.play();
      onPlayStateChange(true);
      console.log('Audio playback started');

    } catch (error) {
      console.error('Error in text-to-speech process:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to generate speech. Please try again.');
      }
      onPlayStateChange(false);
      onAudioElement(null);
      audioManager.cleanup();
    } finally {
      setIsLoading(false);
      console.log('Text-to-speech process completed');
    }
  }, [text, isPlaying, onPlayStateChange, onAudioElement]);

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Testing API key...');
      const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey.trim()
        }
      });

      if (!testResponse.ok) {
        console.error('API key test failed:', testResponse.status, testResponse.statusText);
        throw new Error('Invalid API key');
      }

      console.log('Saving API key to Supabase...');
      const { error } = await supabase
        .from('secrets')
        .upsert({ 
          name: 'ELEVEN_LABS_API_KEY',
          secret: apiKey.trim()
        });

      if (error) {
        console.error('Error saving API key:', error);
        throw error;
      }

      toast.success('API key saved successfully');
      setShowApiKeyDialog(false);
      handleTextToSpeech();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Invalid API key');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={handleTextToSpeech}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-6 py-3 text-base transition-all duration-200",
          isPlaying && "bg-primary text-primary-foreground animate-pulse"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <>
            <VolumeX className="h-5 w-5" />
            <span>Stop Audio</span>
          </>
        ) : (
          <>
            <Volume2 className="h-5 w-5" />
            <span>Listen</span>
          </>
        )}
      </Button>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ElevenLabs API Key Required</DialogTitle>
            <DialogDescription>
              Please enter your ElevenLabs API key to enable text-to-speech functionality.
              You can find your API key in your ElevenLabs dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
              />
            </div>
            <Button type="submit" disabled={!apiKey.trim()}>
              Save API Key
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};