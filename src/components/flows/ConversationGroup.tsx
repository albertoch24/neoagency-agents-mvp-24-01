import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useBriefOutputs } from "@/hooks/useBriefOutputs";
import { useConversationFilters } from "@/hooks/useConversationFilters";
import { ConversationGroupContent } from "./ConversationGroupContent";

interface ConversationGroupProps {
  group: any;
  index: number;
  isPlaying: { [key: string]: boolean };
  audioElements: { [key: string]: HTMLAudioElement | null };
  visibleTexts: { [key: string]: boolean };
  onPlayStateChange: (convId: string, playing: boolean) => void;
  onAudioElement: (convId: string, audio: HTMLAudioElement | null) => void;
  onToggleText: (convId: string) => void;
}

export const ConversationGroup = ({
  group,
  index,
  isPlaying,
  audioElements,
  visibleTexts,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
}: ConversationGroupProps) => {
  console.log("ConversationGroup rendering with group:", {
    groupId: group?.id,
    agentName: group?.agent?.name,
    briefId: group?.briefId,
    stageId: group?.stageId,
    conversationsCount: group?.conversations?.length,
    orderIndex: group?.orderIndex,
    conversations: group?.conversations?.map((conv: any) => ({
      id: conv.id,
      type: conv.output_type,
      contentLength: conv.content?.length,
      hasFlowStepId: !!conv.flow_step_id,
      isVisible: visibleTexts[conv.id]
    }))
  });

  const { data: briefOutputs } = useBriefOutputs(group.briefId, group.stageId);

  return (
    <Card className="overflow-hidden border-agent">
      <CardContent>
        <ConversationGroupContent
          group={group}
          index={index}
          conversationalOutputs={group.conversations || []}
          isPlaying={isPlaying}
          visibleTexts={visibleTexts}
          onPlayStateChange={onPlayStateChange}
          onAudioElement={onAudioElement}
          onToggleText={onToggleText}
        />
      </CardContent>
    </Card>
  );
};