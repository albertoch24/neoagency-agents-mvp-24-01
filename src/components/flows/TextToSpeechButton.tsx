import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioManager } from "@/utils/elevenlabs/audio";
import { getVoiceId } from "@/utils/elevenlabs/api";

interface TextToSpeechButtonProps {
  text: string;
  convId: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
}

export const TextToSpeechButton = ({ 
  text,
  convId,
  isPlaying,
  onPlayStateChange,
  onAudioElement,
}: TextToSpeechButtonProps) => {
  const audioManager = new AudioManager();

  const handlePlay = async () => {
    if (!text) return;

    try {
      const voiceId = await getVoiceId();
      const audio = await audioManager.play(text, voiceId);
      onAudioElement(audio);
      onPlayStateChange(true);
    } catch (error) {
      toast.error("Failed to play audio");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 px-3 gap-2"
      onClick={handlePlay}
      disabled={!text}
    >
      {isPlaying ? (
        <Square className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Listen
    </Button>
  );
};