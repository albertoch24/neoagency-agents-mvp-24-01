import React from 'react';
import { TextToSpeechButton } from "./TextToSpeechButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarkdownContent } from "./MarkdownContent";

interface ConversationContentProps {
  conversation: any;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
  visibleText: boolean;
  onToggleText: () => void;
}

export const ConversationContent: React.FC<ConversationContentProps> = ({
  conversation,
  isPlaying,
  onPlayStateChange,
  onAudioElement,
  visibleText,
  onToggleText,
}) => {
  console.log("Rendering conversation with summary:", conversation.summary);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <h5 className="text-sm font-bold text-muted-foreground flex-shrink-0">
          {conversation.requirements ? (
            <span className="text-primary">Description: {conversation.requirements}</span>
          ) : (
            'TEAM CONVERSATION'
          )}
        </h5>
        <div className="flex items-center gap-2">
          <TextToSpeechButton
            text={conversation.content}
            convId={conversation.id}
            isPlaying={isPlaying}
            onPlayStateChange={onPlayStateChange}
            onAudioElement={onAudioElement}
          />
          <button
            onClick={onToggleText}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {visibleText ? "Hide text" : "Show text"}
          </button>
        </div>
      </div>
      <div className="bg-agent/5 rounded-lg p-6 shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="content" className="border-none">
            <AccordionTrigger data-accordion-id={conversation.id} className="hidden">
              Toggle Content
            </AccordionTrigger>
            <AccordionContent forceMount>
              <div className={visibleText ? "block" : "hidden"}>
                <MarkdownContent content={conversation.content} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      {conversation.summary && (
        <div className="mt-4 bg-muted rounded-lg p-4">
          <h6 className="text-sm font-medium mb-2">Schematic Output:</h6>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownContent content={conversation.summary} />
          </div>
        </div>
      )}
    </div>
  );
};