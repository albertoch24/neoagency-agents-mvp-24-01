import { useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchElevenLabsApiKey, generateSpeech } from "@/utils/elevenlabs/api";
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
      if (isPlaying) {
        console.log('Stopping current playback...');
        onPlayStateChange(false);
        onAudioElement(null);
        return;
      }

      setIsLoading(true);
      console.log('Starting text-to-speech process...');

      const apiKey = await fetchElevenLabsApiKey();
      const response = await generateSpeech(text, "pFZP5JQG7iQjIQuC4Bku", apiKey);
      
      console.log('Successfully received audio response from ElevenLabs');
      const audioBlob = await response.blob();
      
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
      console.error('Unexpected error in text-to-speech process:', error);
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
      const { error } = await supabase
        .from('secrets')
        .upsert({ 
          name: 'ELEVEN_LABS_API_KEY',
          secret: apiKey.trim()
        });

      if (error) throw error;

      toast.success('API key saved successfully');
      setShowApiKeyDialog(false);
      handleTextToSpeech();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    }
  };

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