import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CardContent } from "@/components/ui/card";

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  return (
    <CardContent className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 mb-4 p-4 border rounded-md">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </ScrollArea>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask something..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
      <div className="text-sm text-muted-foreground mt-2">
        Updated {formatDistanceToNow(parseISO(updatedAt), { addSuffix: true })}
      </div>
    </CardContent>
  );
};