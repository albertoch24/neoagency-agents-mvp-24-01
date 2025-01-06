import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import { StructuredOutput } from "./StructuredOutput";
import { AudioControls } from "./AudioControls";
import { ConversationControls } from "./ConversationControls";

interface ConversationContentProps {
  conversation: any;
  isPlaying: boolean;
  visibleText: boolean;
  visibleStructuredOutput: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
  onToggleText: () => void;
  onToggleStructuredOutput: () => void;
}

export const ConversationContent = ({
  conversation,
  isPlaying,
  visibleText,
  visibleStructuredOutput,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
  onToggleStructuredOutput,
}: ConversationContentProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [localVisibleText, setLocalVisibleText] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  console.log("ConversationContent rendering:", {
    conversationId: conversation?.id,
    isPlaying,
    visibleText,
    audioUrl,
    localVisibleText
  });

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handlePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      onPlayStateChange(false);
      return;
    }

    try {
      const response = await fetch(`/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: conversation.content }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      onAudioElement(audio);
      
      audio.onended = () => {
        onPlayStateChange(false);
      };
      
      audio.play();
      onPlayStateChange(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      onPlayStateChange(false);
    }
  };

  const handleToggleText = () => {
    setLocalVisibleText(!localVisibleText);
    onToggleText();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            visibleStructuredOutput && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={onToggleStructuredOutput}
        >
          {visibleStructuredOutput ? "Hide Structured Output" : "Show Structured Output"}
        </Button>
        <ConversationControls 
          isVisible={localVisibleText} 
          onToggle={handleToggleText} 
        />
        <AudioControls 
          isPlaying={isPlaying} 
          onPlay={handlePlay} 
        />
      </div>

      {localVisibleText && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <MarkdownContent content={conversation.content} />
        </div>
      )}
    </div>
  );
};