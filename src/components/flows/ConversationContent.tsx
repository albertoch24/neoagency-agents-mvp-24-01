import { AudioControls } from "./AudioControls";
import { ConversationControls } from "./ConversationControls";
import { MarkdownContent } from "./MarkdownContent";

interface ConversationContentProps {
  conversation: any;
  isPlaying: boolean;
  visibleText: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
  onToggleText: () => void;
}

export const ConversationContent = ({
  conversation,
  isPlaying,
  visibleText,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
}: ConversationContentProps) => {
  return (
    <div className="space-y-4">
      <ConversationControls
        visibleText={visibleText}
        onToggleText={onToggleText}
      />

      {visibleText && (
        <div className="bg-muted/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="prose prose-sm max-w-none">
            <MarkdownContent content={conversation.content} />
          </div>
        </div>
      )}

      {conversation.audio_url && (
        <AudioControls
          audioUrl={conversation.audio_url}
          isPlaying={isPlaying}
          onPlayStateChange={onPlayStateChange}
          onAudioElement={onAudioElement}
        />
      )}
    </div>
  );
};