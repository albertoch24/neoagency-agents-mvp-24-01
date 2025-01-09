import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ConversationControls } from "./ConversationControls";
import { ConversationSection } from "./ConversationSection";
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
  const [parsedContent, setParsedContent] = useState<Array<{ text: string }> | null>(null);

  useEffect(() => {
    if (!conversation.content) return;

    try {
      // Try to parse as JSON if it's a string
      if (typeof conversation.content === 'string') {
        const parsed = JSON.parse(conversation.content);
        setParsedContent(Array.isArray(parsed) ? parsed : [{ text: conversation.content }]);
      } else {
        // If it's already an object/array, use it directly
        setParsedContent(Array.isArray(conversation.content) ? conversation.content : [{ text: String(conversation.content) }]);
      }
    } catch (error) {
      // If parsing fails, treat as plain text
      console.log("Content parsing failed, using as plain text:", error);
      setParsedContent([{ text: conversation.content }]);
    }
  }, [conversation.content]);

  return (
    <Card className="relative overflow-hidden">
      <ConversationControls
        isVisible={visibleText}
        onToggle={onToggleText}
      />
      
      <div className={`${visibleText ? 'block' : 'hidden'} bg-muted/30 rounded-lg p-4 backdrop-blur-sm`}>
        <div className="prose prose-sm max-w-none">
          {parsedContent && parsedContent.map((item, index) => (
            <div key={index} className="mb-4">
              <MarkdownContent content={item.text} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};