import { Card } from "@/components/ui/card";
import { MarkdownContent } from "./MarkdownContent";
import { ConversationControls } from "./ConversationControls";

interface ConversationContentProps {
  content: string;
  role?: string;
  isLast?: boolean;
  isPlaying?: boolean;
  visibleText?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onAudioElement?: (audio: HTMLAudioElement | null) => void;
  onToggleText?: () => void;
}

export const ConversationContent = ({
  content,
  role = "assistant",
  isLast = false,
  isPlaying = false,
  visibleText = true,
  onPlayStateChange,
  onAudioElement,
  onToggleText
}: ConversationContentProps) => {
  return (
    <Card className="p-4">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <MarkdownContent content={content} />
      </div>
      {isLast && (
        <div className="mt-4 flex justify-end">
          <ConversationControls 
            content={content}
            isPlaying={isPlaying}
            visibleText={visibleText}
            onPlayStateChange={onPlayStateChange}
            onAudioElement={onAudioElement}
            onToggleText={onToggleText}
          />
        </div>
      )}
    </Card>
  );
};