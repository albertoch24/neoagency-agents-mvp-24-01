import React from 'react';
import { TextToSpeechButton } from "./TextToSpeechButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarkdownContent } from "./MarkdownContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  // Query per ottenere i brief outputs relativi a questo stage
  const { data: briefOutput } = useQuery({
    queryKey: ["brief-outputs", conversation.brief_id, conversation.stage_id],
    queryFn: async () => {
      console.log("Fetching brief outputs for stage:", conversation.stage_id);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", conversation.brief_id)
        .eq("stage", conversation.stage_id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.error("Error fetching brief outputs:", error);
        return null;
      }

      return data;
    },
    enabled: !!conversation.brief_id && !!conversation.stage_id
  });

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

      {/* Brief Output Content - Always visible */}
      {briefOutput && briefOutput.content && (
        <div className="mb-6">
          <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-4 text-primary">
              Output Strutturato
            </h4>
            <div className="prose prose-sm max-w-none">
              <MarkdownContent content={JSON.stringify(briefOutput.content, null, 2)} />
            </div>
          </div>
        </div>
      )}

      {/* Conversation Content - In Accordion */}
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