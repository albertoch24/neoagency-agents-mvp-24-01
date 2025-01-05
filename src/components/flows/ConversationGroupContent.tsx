import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { ConversationContent } from "./ConversationContent";
import { StructuredOutput } from "./StructuredOutput";
import { Button } from "@/components/ui/button";
import { Headphones, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationGroupContentProps {
  group: any;
  index: number;
  conversationalOutputs: any[];
  isPlaying: { [key: string]: boolean };
  visibleTexts: { [key: string]: boolean };
  visibleStructuredOutputs: { [key: string]: boolean };
  onPlayStateChange: (convId: string, playing: boolean) => void;
  onAudioElement: (convId: string, audio: HTMLAudioElement | null) => void;
  onToggleText: (convId: string) => void;
  onToggleStructuredOutput: (stepId: string) => void;
}

export const ConversationGroupContent = ({
  group,
  index,
  conversationalOutputs,
  isPlaying,
  visibleTexts,
  visibleStructuredOutputs,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
  onToggleStructuredOutput,
}: ConversationGroupContentProps) => {
  console.log("ConversationGroupContent rendering:", {
    groupId: group?.id,
    conversationalOutputsCount: conversationalOutputs?.length,
    stepId: group.conversations?.[0]?.flow_step_id,
    isStructuredOutputVisible: visibleStructuredOutputs[group.conversations?.[0]?.flow_step_id]
  });

  return (
    <div className="p-4">
      <AgentHeader 
        agentName={group.agent?.name} 
        index={index}
        orderIndex={group.orderIndex}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <AgentSkills skills={group.agent?.skills || []} />
        </div>

        {conversationalOutputs.map((conversation: any) => {
          const isCurrentPlaying = isPlaying[conversation.id] || false;
          
          return (
            <div key={conversation.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2",
                    isCurrentPlaying && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => onPlayStateChange(conversation.id, !isCurrentPlaying)}
                >
                  <Headphones className="h-4 w-4" />
                  {isCurrentPlaying ? "Playing..." : "Play"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2",
                    visibleTexts[conversation.id] && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => onToggleText(conversation.id)}
                >
                  <Type className="h-4 w-4" />
                  {visibleTexts[conversation.id] ? "Hide Text" : "Show Text"}
                </Button>
              </div>
              
              <ConversationContent
                conversation={conversation}
                isPlaying={isCurrentPlaying}
                onPlayStateChange={(playing) =>
                  onPlayStateChange(conversation.id, playing)
                }
                onAudioElement={(audio) => onAudioElement(conversation.id, audio)}
                visibleText={visibleTexts[conversation.id] || false}
                onToggleText={() => onToggleText(conversation.id)}
              />
            </div>
          );
        })}

        {group.conversations?.[0]?.flow_step_id && (
          <StructuredOutput 
            stepId={group.conversations[0].flow_step_id}
            isVisible={visibleStructuredOutputs[group.conversations[0].flow_step_id]}
            onToggleVisibility={() => onToggleStructuredOutput(group.conversations[0].flow_step_id)}
          />
        )}
      </div>
    </div>
  );
};