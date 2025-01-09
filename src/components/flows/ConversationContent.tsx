import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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

interface ParsedContent {
  text: string;
}

export const ConversationContent = ({
  conversation,
  visibleText,
  onToggleText,
}: ConversationContentProps) => {
  const [parsedContent, setParsedContent] = useState<ParsedContent[]>([]);

  useEffect(() => {
    if (!conversation?.content) {
      setParsedContent([]);
      return;
    }

    try {
      // Handle direct array content
      if (Array.isArray(conversation.content)) {
        setParsedContent(conversation.content.map(item => ({
          text: typeof item === 'string' ? item : item.text || String(item)
        })));
        return;
      }

      // Handle JSON string
      if (typeof conversation.content === 'string') {
        try {
          const parsed = JSON.parse(conversation.content);
          if (Array.isArray(parsed)) {
            setParsedContent(parsed.map(item => ({
              text: typeof item === 'string' ? item : item.text || String(item)
            })));
          } else {
            setParsedContent([{ text: String(parsed) }]);
          }
          return;
        } catch {
          // If JSON parsing fails, treat as plain text
          setParsedContent([{ text: conversation.content }]);
          return;
        }
      }

      // Handle other types
      setParsedContent([{ text: String(conversation.content) }]);
    } catch (error) {
      console.error("Content parsing failed:", error);
      setParsedContent([{ text: String(conversation.content) }]);
    }
  }, [conversation?.content]);

  console.log("Parsed content:", parsedContent); // Debug log
  console.log("Visibility state:", visibleText); // Debug log

  return (
    <Card className="relative overflow-hidden">
      <ConversationControls
        isVisible={visibleText}
        onToggle={onToggleText}
      />
      
      <div className={`${visibleText ? 'block' : 'hidden'} bg-muted/30 rounded-lg p-4 backdrop-blur-sm`}>
        <div className="prose prose-sm max-w-none">
          {parsedContent.map((item, index) => (
            <div key={index} className="mb-4">
              <MarkdownContent content={item.text} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};