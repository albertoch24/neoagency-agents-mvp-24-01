import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { ConversationContent } from "./ConversationContent";
import { StructuredOutput } from "./StructuredOutput";
import { Json } from "@/integrations/supabase/types";

interface DatabaseBriefOutput {
  id: string;
  brief_id: string;
  stage: string;
  content: Json;
  created_at: string;
  updated_at: string;
  stage_id: string | null;
  output_type: string;
}

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
    orderIndex: group?.orderIndex
  });

  const { data: briefOutputs } = useQuery<DatabaseBriefOutput[]>({
    queryKey: ["brief-outputs", group.briefId, group.stageId],
    queryFn: async () => {
      console.log("Fetching brief outputs for:", { 
        briefId: group.briefId, 
        stageId: group.stageId 
      });
      
      if (!group.briefId || !group.stageId) {
        console.log("Missing briefId or stageId:", { briefId: group.briefId, stageId: group.stageId });
        return [];
      }

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", group.briefId)
        .eq("stage", group.stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching brief outputs:", error);
        return [];
      }

      console.log("Found brief outputs:", data);
      return data;
    },
    enabled: !!group.briefId && !!group.stageId
  });

  // Filter conversations by output type
  const conversationalOutputs = group.conversations.filter((conv: any) => {
    const isConversational = conv.output_type === 'conversational';
    console.log("Filtering conversation:", {
      id: conv.id,
      type: conv.output_type,
      isConversational,
      content: conv.content?.substring(0, 100) // Log first 100 chars of content
    });
    return isConversational;
  });

  const structuredOutputs = group.conversations.filter((conv: any) => {
    const isStructured = conv.output_type === 'structured';
    console.log("Filtering structured output:", {
      id: conv.id,
      type: conv.output_type,
      isStructured
    });
    return isStructured;
  });

  // Get the most recent brief output
  const latestBriefOutput = briefOutputs?.[0];
  console.log("Latest brief output:", {
    id: latestBriefOutput?.id,
    type: latestBriefOutput?.output_type,
    contentSample: typeof latestBriefOutput?.content === 'object' 
      ? JSON.stringify(latestBriefOutput?.content).substring(0, 100) 
      : 'No content'
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

        {latestBriefOutput && (
          <StructuredOutput 
            content={latestBriefOutput.content} 
            stepId={group.conversations[0]?.flow_step_id}
          />
        )}

        {conversationalOutputs.map((conversation: any) => {
          console.log("Rendering conversation:", {
            id: conversation.id,
            hasContent: !!conversation.content,
            contentLength: conversation.content?.length,
            isPlaying: isPlaying[conversation.id],
            isVisible: visibleTexts[conversation.id]
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