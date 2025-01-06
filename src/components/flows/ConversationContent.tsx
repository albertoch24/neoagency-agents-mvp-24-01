import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import { AudioControls } from "./AudioControls";
import { ConversationControls } from "./ConversationControls";
import { TextToSpeechButton } from "./TextToSpeechButton";

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
  const [localVisibleText, setLocalVisibleText] = useState(false);

  console.log("ConversationContent rendering:", {
    conversationId: conversation?.id,
    isPlaying,
    visibleText,
    localVisibleText
  });

  const handleToggleText = () => {
    setLocalVisibleText(!localVisibleText);
    onToggleText();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <TextToSpeechButton
          text={conversation.content}
          convId={conversation.id}
          isPlaying={isPlaying}
          onPlayStateChange={onPlayStateChange}
          onAudioElement={onAudioElement}
        />
        <ConversationControls 
          isVisible={localVisibleText} 
          onToggle={handleToggleText} 
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