import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { ConversationGroup } from "./ConversationGroup";

interface AgentSequenceProps {
  conversations: any[];
}

interface GroupedConversation {
  agent: {
    id: string;
    name: string;
  };
  conversations: any[];
  summary: any;
  orderIndex: number;
  briefId: string;
  stageId: string;
  flowStep?: {
    order_index?: number;
  };
}

export const AgentSequence = ({ conversations = [] }: AgentSequenceProps) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement | null}>({});
  const [visibleTexts, setVisibleTexts] = useState<{[key: string]: boolean}>({});

  // Sort conversations by order_index first, then creation date
  const sortedConversations = [...conversations].sort((a, b) => {
    console.log("Sorting conversation A:", a);
    console.log("Sorting conversation B:", b);
    
    // First try to sort by order_index directly from the conversation
    const aIndex = a.order_index ?? 0;
    const bIndex = b.order_index ?? 0;
    
    console.log("Comparing order indices:", aIndex, bIndex);
    
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    
    // Fallback to creation date if order_index is the same
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Group conversations by flow step ID to maintain step order
  const groupedConversations = sortedConversations.reduce((acc: Record<string, GroupedConversation>, conv: any) => {
    if (!conv) return acc;
    
    const stepId = conv.flow_step_id || `no-step-${conv.id}`;
    if (!acc[stepId]) {
      acc[stepId] = {
        agent: conv.agents || { id: conv.agent_id, name: conv.agent_name || 'Unknown Agent' },
        conversations: [],
        summary: null,
        orderIndex: conv.order_index ?? 0,
        briefId: conv.brief_id,
        stageId: conv.stage_id,
        flowStep: {
          order_index: conv.order_index ?? 0
        }
      };
    }
    
    if (conv.output_type === 'summary') {
      acc[stepId].summary = conv;
    } else {
      acc[stepId].conversations.push(conv);
    }
    
    return acc;
  }, {});

  const handlePlayStateChange = (convId: string, playing: boolean) => {
    setIsPlaying(prev => ({ ...prev, [convId]: playing }));
  };

  const handleAudioElement = (convId: string, audio: HTMLAudioElement | null) => {
    if (audioElements[convId]) {
      audioElements[convId]?.pause();
      audioElements[convId]?.remove();
    }
    setAudioElements(prev => ({ ...prev, [convId]: audio }));
  };

  const toggleText = (convId: string) => {
    setVisibleTexts(prev => ({ ...prev, [convId]: !prev[convId] }));
    const accordionElement = document.querySelector(`[data-accordion-id="${convId}"]`);
    if (accordionElement) {
      (accordionElement as HTMLButtonElement).click();
    }
  };

  // Sort groups by order index to maintain step sequence
  const sortedGroups = Object.entries(groupedConversations)
    .sort(([, a]: [string, GroupedConversation], [, b]: [string, GroupedConversation]) => {
      const aIndex = a.orderIndex ?? 0;
      const bIndex = b.orderIndex ?? 0;
      return aIndex - bIndex;
    });

  console.log("Sorted groups:", sortedGroups.map(([, group]: [string, GroupedConversation]) => ({
    orderIndex: group.orderIndex,
    flowStep: group.flowStep
  })));

  return (
    <div className="space-y-4">
      {sortedGroups.map(([stepId, group]: [string, GroupedConversation]) => (
        <Card key={`${group.agent?.id}-${stepId}`} className="overflow-hidden border-agent">
          <CardContent>
            <ConversationGroup
              group={group}
              index={group.orderIndex}
              isPlaying={isPlaying}
              audioElements={audioElements}
              visibleTexts={visibleTexts}
              onPlayStateChange={handlePlayStateChange}
              onAudioElement={handleAudioElement}
              onToggleText={toggleText}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};