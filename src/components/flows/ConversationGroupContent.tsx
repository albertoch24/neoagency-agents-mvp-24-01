import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { ConversationContent } from "./ConversationContent";
import { StructuredOutput } from "./StructuredOutput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    isStructuredOutputVisible: visibleStructuredOutputs[group.conversations?.[0]?.flow_step_id],
    hasFlowStepId: !!group.conversations?.[0]?.flow_step_id,
    structuredOutputsState: visibleStructuredOutputs,
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
                    visibleStructuredOutput={visibleStructuredOutputs[conversation.flow_step_id] || false}
                    onPlayStateChange={(playing) => onPlayStateChange(conversation.id, playing)}
                    onAudioElement={(audio) => onAudioElement(conversation.id, audio)}
                    onToggleText={() => onToggleText(conversation.id)}
                    onToggleStructuredOutput={() => onToggleStructuredOutput(conversation.flow_step_id)}
                  />
                ))}

                {group.conversations?.[0]?.flow_step_id && (
                  <StructuredOutput 
                    stepId={group.conversations[0].flow_step_id}
                    isVisible={visibleStructuredOutputs[group.conversations[0].flow_step_id] ?? true}
                    onToggleVisibility={() => onToggleStructuredOutput(group.conversations[0].flow_step_id)}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AgentHeader>
    </div>
  );
};