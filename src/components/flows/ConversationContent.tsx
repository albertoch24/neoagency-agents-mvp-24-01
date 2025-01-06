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
  const [localVisibleText, setLocalVisibleText] = useState(true); // Set default to true
  const audioRef = useRef<HTMLAudioElement | null>(null);

  console.log("ConversationContent rendering:", {
    conversationId: conversation?.id,
    hasContent: !!conversation?.content,
    contentLength: conversation?.content?.length,
    isPlaying,
    visibleText: localVisibleText,
    outputType: conversation?.output_type,
    flowStepId: conversation?.flow_step_id,
    hasAudioUrl: !!audioUrl
  });

  useEffect(() => {
    const fetchAudio = async () => {
      console.log("Fetching audio for conversation:", conversation?.id);
      try {
        const response = await fetch(`/api/audio/${conversation.id}`);
        const data = await response.json();
        console.log("Audio fetch response:", {
          conversationId: conversation.id,
          success: response.ok,
          audioUrl: data.url,
          visibleText: localVisibleText
        });
        setAudioUrl(data.url);
      } catch (error) {
        console.error("Error fetching audio:", {
          conversationId: conversation.id,
          error,
          visibleText: localVisibleText
        });
      }
    };

    fetchAudio();
  }, [conversation.id]);

  const handlePlay = () => {
    console.log("Play button clicked:", {
      conversationId: conversation.id,
      currentlyPlaying: isPlaying,
      hasAudioRef: !!audioRef.current,
      visibleText: localVisibleText
    });

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

  const handleToggleText = () => {
    const newVisibility = !localVisibleText;
    setLocalVisibleText(newVisibility);
    onToggleText();
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
          className={cn(
            "gap-2",
            localVisibleText && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={handleToggleText}
        >
          <Type className="h-4 w-4" />
          {localVisibleText ? "Hide Text" : "Show Text"}
        </Button>
      </div>

      {localVisibleText && (
        <div className="rounded-lg border bg-card p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownContent content={conversation.content} />
          </div>
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => onPlayStateChange(true)}
          onPause={() => onPlayStateChange(false)}
          onEnded={() => onPlayStateChange(false)}
          onLoadedMetadata={(e) => {
            console.log("Audio loaded:", {
              conversationId: conversation.id,
              duration: e.currentTarget.duration,
              visibleText: localVisibleText
            });
            onAudioElement(e.currentTarget);
          }}
          onError={(e) => {
            console.error("Audio error:", {
              conversationId: conversation.id,
              error: e,
              visibleText: localVisibleText
            });
            onAudioElement(null);
          }}
        />
      )}
    </div>
  );
};