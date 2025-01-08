import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { ConversationContent } from "./ConversationContent";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ConversationGroupContentProps {
  group: any;
  index: number;
  conversationalOutputs: any[];
  isPlaying: { [key: string]: boolean };
  visibleTexts: { [key: string]: boolean };
  onPlayStateChange: (convId: string, playing: boolean) => void;
  onAudioElement: (convId: string, audio: HTMLAudioElement | null) => void;
  onToggleText: (convId: string) => void;
}

export const ConversationGroupContent = ({
  group,
  index,
  conversationalOutputs,
  isPlaying,
  visibleTexts,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
}: ConversationGroupContentProps) => {
  console.log("ConversationGroupContent rendering:", {
    groupId: group?.id,
    conversationalOutputsCount: conversationalOutputs?.length,
    stepId: group.conversations?.[0]?.flow_step_id,
    orderIndex: group.orderIndex,
    flowStep: group.conversations?.[0]?.flow_step
  });

  const stepOrderIndex = group.conversations?.[0]?.flow_step?.order_index ?? group.orderIndex;
  const stepDescription = group.conversations?.[0]?.flow_step?.description;

  return (
    <div className="p-4">
      <AgentHeader 
        agentName={group.agent?.name} 
        index={index}
        orderIndex={stepOrderIndex}
        outputs={group.outputs}
        description={stepDescription}
      >
        <Accordion type="single" collapsible defaultValue="content" className="w-full">
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm font-medium">
              View Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <AgentSkills skills={group.agent?.skills || []} />
                </div>

                {conversationalOutputs.map((conversation: any) => (
                  <ConversationContent
                    key={conversation.id}
                    conversation={conversation}
                    isPlaying={isPlaying[conversation.id] || false}
                    visibleText={visibleTexts[conversation.id] || false}
                    onPlayStateChange={(playing) => onPlayStateChange(conversation.id, playing)}
                    onAudioElement={(audio) => onAudioElement(conversation.id, audio)}
                    onToggleText={() => onToggleText(conversation.id)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AgentHeader>
    </div>
  );
};