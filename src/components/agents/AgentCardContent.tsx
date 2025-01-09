import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CardContent } from "@/components/ui/card";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

interface AgentCardContentProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  updatedAt: string;
}

export const AgentCardContent: React.FC<AgentCardContentProps> = ({
  messages,
  isLoading,
  input,
  onInputChange,
  onSubmit,
  updatedAt
}) => {
  // Parse the content if it's a JSON string
  const parseContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(item => item.text).join('\n');
      }
      return content;
    } catch (e) {
      return content;
    }
  };

  return (
    <CardContent className="flex-1 flex flex-col gap-4 p-4">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div>{parseContent(message.content)}</div>
                  {message.audioUrl && (
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={message.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="space-y-2">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask something..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(parseISO(updatedAt), { addSuffix: true })}
        </div>
      </div>
    </CardContent>
  );
};