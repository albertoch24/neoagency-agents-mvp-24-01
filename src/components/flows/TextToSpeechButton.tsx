import { useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

interface TextToSpeechButtonProps {
  text: string;
  convId: string;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

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
  const [retryCount, setRetryCount] = useState(0);

  const validateApiKey = async (key: string): Promise<boolean> => {
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

  const saveApiKey = async (key: string) => {
    const isValid = await validateApiKey(key);
    if (!isValid) {
      toast.error('Invalid API key. Please check and try again.');
      return false;
    }

    const { error } = await supabase
      .from('secrets')
      .upsert({ 
        name: 'ELEVEN_LABS_API_KEY',
        secret: key.trim()
      });

    if (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
      return false;
    }

    toast.success('API key saved successfully');
    setShowApiKeyDialog(false);
    return true;
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await saveApiKey(apiKey)) {
      handleTextToSpeech();
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleTextToSpeech = useCallback(async () => {
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
        console.log('No API key found, showing dialog...');
        setShowApiKeyDialog(true);
        return;
      }

      const makeRequest = async (retryCount: number = 0): Promise<Response> => {
        console.log(`Making request to ElevenLabs API (attempt ${retryCount + 1})...`);
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
            
            setShowApiKeyDialog(true);
            throw new Error('Invalid API key');
          }

          if (response.status === 429) {
            if (retryCount < MAX_RETRIES) {
              console.log(`Rate limit exceeded, retrying in ${RETRY_DELAY}ms...`);
              await sleep(RETRY_DELAY * (retryCount + 1));
              return makeRequest(retryCount + 1);
            }
            throw new Error('Rate limit exceeded. Please try again later.');
          }

          throw new Error(errorData.detail?.message || 'Unknown error');
        }

        return response;
      };

      const response = await makeRequest();
      console.log('Successfully received audio response from ElevenLabs');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('Creating audio element...');
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('Audio playback completed');
        onPlayStateChange(false);
        onAudioElement(null);
        URL.revokeObjectURL(audioUrl);
        console.log('Audio resources cleaned up');
      };
      
      onAudioElement(audio);
      audio.play();
      onPlayStateChange(true);
      console.log('Audio playback started');

    } catch (error) {
      console.error('Unexpected error in text-to-speech process:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to generate speech. Please try again.');
      }
      onPlayStateChange(false);
      onAudioElement(null);
    } finally {
      setIsLoading(false);
      setRetryCount(0);
      console.log('Text-to-speech process completed');
    }
  }, [text, isPlaying, onPlayStateChange, onAudioElement]);

  return (
    <>
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