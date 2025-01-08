import { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import { AudioControls } from "./AudioControls";
import { ConversationControls } from "./ConversationControls";
import { TextToSpeechButton } from "./TextToSpeechButton";
import { AgentFeedback } from "./AgentFeedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, MessagesSquare } from "lucide-react";

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
    <div className="space-y-4">
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
        <Tabs defaultValue="langchain" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="langchain" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              LangChain Output
            </TabsTrigger>
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              Standard Output
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="langchain">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-primary/10">
                    LangChain Enhanced
                  </Badge>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownContent content={conversation.content} />
                </div>
                {conversation.reasoning && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Reasoning Process:</h4>
                    <MarkdownContent content={conversation.reasoning} />
                  </div>
                )}
                {conversation.consultations?.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Agent Consultations:</h4>
                    {conversation.consultations.map((consultation: any, index: number) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <p className="text-sm text-muted-foreground">
                          Consulted with {consultation.agent}: {consultation.response}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standard">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">Standard Output</Badge>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownContent content={conversation.standardContent || conversation.content} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AgentFeedback conversationId={conversation.id} />
    </div>
  );
};