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
  const { filterConversationalOutputs, filterStructuredOutputs } = useConversationFilters(group.conversations);

  // Filter conversations by output type
  const conversationalOutputs = filterConversationalOutputs(visibleTexts);
  const structuredOutputs = filterStructuredOutputs(visibleTexts);

  // Get the most recent brief output
  const latestBriefOutput = briefOutputs?.[0];
  console.log("Latest brief output:", {
    id: latestBriefOutput?.id,
    type: latestBriefOutput?.output_type,
    contentSample: typeof latestBriefOutput?.content === 'object' 
      ? JSON.stringify(latestBriefOutput?.content).substring(0, 100) 
      : 'No content',
    hasStageId: !!latestBriefOutput?.stage_id,
    stage: latestBriefOutput?.stage,
    contentLength: typeof latestBriefOutput?.content === 'object' 
      ? JSON.stringify(latestBriefOutput?.content).length 
      : 0
  });

  return (
    <Card className="overflow-hidden border-agent">
      <CardContent>
        <ConversationGroupContent
          group={group}
          index={index}
          latestBriefOutput={latestBriefOutput}
          conversationalOutputs={conversationalOutputs}
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