import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { ConversationContent } from "./ConversationContent";
import { StructuredOutput } from "./StructuredOutput";

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

        {group.conversations?.[0]?.flow_step_id && (
          <StructuredOutput 
            stepId={group.conversations[0].flow_step_id}
            isVisible={visibleStructuredOutputs[group.conversations[0].flow_step_id]}
            onToggleVisibility={() => onToggleStructuredOutput(group.conversations[0].flow_step_id)}
          />
        )}

        {conversationalOutputs.map((conversation: any) => {
          console.log("Rendering conversation:", {
            id: conversation.id,
            hasContent: !!conversation.content,
            contentLength: conversation.content?.length,
            isPlaying: isPlaying[conversation.id],
            isVisible: visibleTexts[conversation.id],
            flowStepId: conversation.flow_step_id,
            outputType: conversation.output_type,
            hasAudioUrl: !!conversation.audio_url
          });
          
          return (
            <ConversationContent
              key={conversation.id}
              conversation={conversation}
              isPlaying={isPlaying[conversation.id] || false}
              onPlayStateChange={(playing) =>
                onPlayStateChange(conversation.id, playing)
              }
              onAudioElement={(audio) => onAudioElement(conversation.id, audio)}
              visibleText={visibleTexts[conversation.id] || false}
              onToggleText={() => onToggleText(conversation.id)}
            />
          );
        })}
      </div>
    </div>
  );
};