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
  console.log("Rendering conversation:", {
    id: conversation.id,
    agentId: conversation.agent_id,
    requirements: conversation.requirements,
    flowStepId: conversation.flow_step_id,
    outputType: conversation.output_type
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <h5 className="text-sm font-bold text-muted-foreground flex-shrink-0">
          {conversation.requirements ? (
            <span className="text-primary">Requirements: {conversation.requirements}</span>
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
        <Accordion type="single" collapsible className="w-full" defaultValue="content">
          <AccordionItem value="content" className="border-none">
            <AccordionTrigger data-accordion-id={conversation.id} className="hidden">
              Toggle Content
            </AccordionTrigger>
            <AccordionContent>
              <MarkdownContent content={conversation.content} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};