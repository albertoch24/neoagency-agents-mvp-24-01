import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Headphones, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";

interface ConversationContentProps {
  conversation: any;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
  visibleText: boolean;
  onToggleText: () => void;
}

export const ConversationContent = ({
  conversation,
  isPlaying,
  onPlayStateChange,
  onAudioElement,
  visibleText,
  onToggleText,
}: ConversationContentProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      // Fetch audio URL based on conversation ID
      const response = await fetch(`/api/audio/${conversation.id}`);
      const data = await response.json();
      setAudioUrl(data.url);
    };

    fetchAudio();
  }, [conversation.id]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPlayStateChange(false);
      } else {
        audioRef.current.play();
        onPlayStateChange(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            isPlaying && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={handlePlay}
          disabled={!audioUrl}
        >
          <Headphones className="h-4 w-4" />
          {isPlaying ? "Playing..." : "Play"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onToggleText}
        >
          <Type className="h-4 w-4" />
          {visibleText ? "Hide Text" : "Show Text"}
        </Button>
      </div>

      {visibleText && (
        <div className="rounded-lg border bg-card p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownContent content={conversation.content} />
          </div>
        </div>
      )}
    </div>
  );
};