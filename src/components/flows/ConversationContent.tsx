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
    console.log("ConversationContent - Props received:", {
      conversationId: conversation?.id,
      hasContent: !!conversation?.content,
      visibilityState: visibleText,
      rawContent: conversation?.content
    });

    if (!conversation?.content) {
      console.warn("ConversationContent - No content available for parsing");
      setParsedContent([]);
      return;
    }

    try {
      console.log("ConversationContent - Starting content parsing");
      
      // Handle direct array content
      if (Array.isArray(conversation.content)) {
        console.log("ConversationContent - Processing array content:", conversation.content);
        setParsedContent(conversation.content.map(item => {
          const processed = {
            text: typeof item === 'string' ? item : item.text || String(item)
          };
          console.log("ConversationContent - Processed array item:", processed);
          return processed;
        }));
        return;
      }

      // Handle JSON string
      if (typeof conversation.content === 'string') {
        console.log("ConversationContent - Processing string content");
        try {
          const parsed = JSON.parse(conversation.content);
          console.log("ConversationContent - Successfully parsed JSON:", parsed);
          
          if (Array.isArray(parsed)) {
            const processedArray = parsed.map(item => ({
              text: typeof item === 'string' ? item : item.text || String(item)
            }));
            console.log("ConversationContent - Processed JSON array:", processedArray);
            setParsedContent(processedArray);
          } else {
            console.log("ConversationContent - Parsed content is not an array, creating single item");
            setParsedContent([{ text: String(parsed) }]);
          }
          return;
        } catch (parseError) {
          console.warn("ConversationContent - JSON parsing failed, treating as plain text:", parseError);
          setParsedContent([{ text: conversation.content }]);
          return;
        }
      }

      // Handle other types
      console.log("ConversationContent - Handling non-string, non-array content");
      setParsedContent([{ text: String(conversation.content) }]);
    } catch (error) {
      console.error("ConversationContent - Content processing failed:", error);
      setParsedContent([{ text: String(conversation.content) }]);
    }
  }, [conversation?.content]);

  useEffect(() => {
    console.log("ConversationContent - State update:", {
      parsedContentLength: parsedContent.length,
      parsedContent,
      visibilityState: visibleText,
      displayStyle: visibleText ? 'block' : 'hidden'
    });
  }, [parsedContent, visibleText]);

  return (
    <Card className="relative overflow-hidden">
      <ConversationControls
        isVisible={visibleText}
        onToggle={() => {
          console.log("ConversationContent - Toggle visibility:", {
            currentState: visibleText,
            newState: !visibleText
          });
          onToggleText();
        }}
      />
      
      <div 
        className={`${visibleText ? 'block' : 'hidden'} bg-muted/30 rounded-lg p-4 backdrop-blur-sm`}
        onClick={() => {
          console.log("ConversationContent - Content container clicked", {
            isVisible: visibleText,
            hasContent: parsedContent.length > 0
          });
        }}
      >
        <div className="prose prose-sm max-w-none">
          {parsedContent.map((item, index) => {
            console.log("ConversationContent - Rendering content item:", {
              index,
              text: item.text.substring(0, 50) + (item.text.length > 50 ? '...' : '')
            });
            return (
              <div key={index} className="mb-4">
                <MarkdownContent content={item.text} />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};