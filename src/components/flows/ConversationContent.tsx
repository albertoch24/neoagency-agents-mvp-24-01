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
    if (!conversation.content) {
      setParsedContent([]);
      return;
    }

    try {
      // Se il content è già un array di oggetti, usalo direttamente
      if (Array.isArray(conversation.content)) {
        setParsedContent(conversation.content);
        return;
      }

      // Se è una stringa JSON, prova a parsarla
      if (typeof conversation.content === 'string') {
        const parsed = JSON.parse(conversation.content);
        if (Array.isArray(parsed)) {
          setParsedContent(parsed);
          return;
        }
        // Se il parsing produce un oggetto non-array, wrappalo
        setParsedContent([{ text: String(parsed) }]);
        return;
      }

      // Fallback per altri tipi
      setParsedContent([{ text: String(conversation.content) }]);
    } catch (error) {
      console.log("Content parsing failed:", error);
      setParsedContent([{ text: String(conversation.content) }]);
    }
  }, [conversation.content]);

  return (
    <Card className="relative overflow-hidden">
      <ConversationControls
        isVisible={visibleText}
        onToggle={onToggleText}
      />
      
      {visibleText && (
        <div className="bg-muted/30 rounded-lg p-4 backdrop-blur-sm">
          <div className="prose prose-sm max-w-none">
            {parsedContent.map((item, index) => (
              <div key={index} className="mb-4">
                <MarkdownContent content={item.text} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};