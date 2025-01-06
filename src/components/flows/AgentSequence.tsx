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
  const [visibleStructuredOutputs, setVisibleStructuredOutputs] = useState<{[key: string]: boolean}>(() => {
    const initialState: {[key: string]: boolean} = {};
    conversations.forEach(conv => {
      if (conv.flow_step_id) {
        initialState[conv.flow_step_id] = true;
      }
    });
    return initialState;
  });

  // Sort conversations by flow step order first, then creation date
  const sortedConversations = [...conversations].sort((a, b) => {
    // First try to sort by flow step order_index
    if (a.flow_step && b.flow_step) {
      return (a.flow_step.order_index || 0) - (b.flow_step.order_index || 0);
    }
    // Fallback to creation date if no flow step is available
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Group conversations by flow step ID to maintain step order
  const groupedConversations = sortedConversations.reduce((acc: Record<string, GroupedConversation>, conv: any) => {
    if (!conv) return acc;
    
    const stepId = conv.flow_step_id || `no-step-${conv.id}`;
    if (!acc[stepId]) {
      acc[stepId] = {
        agent: conv.agents || { id: conv.agent_id, name: 'Unknown Agent' },
        conversations: [],
        summary: null,
        orderIndex: conv.flow_step?.order_index || 0,
        briefId: conv.brief_id,
        stageId: conv.stage_id,
        flowStep: conv.flow_step
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

  const toggleStructuredOutput = (stepId: string) => {
    console.log("Toggling structured output for step:", stepId, "Current state:", visibleStructuredOutputs[stepId]);
    setVisibleStructuredOutputs(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Sort groups by order index to maintain step sequence
  const sortedGroups = Object.entries(groupedConversations)
    .sort(([, a]: [string, GroupedConversation], [, b]: [string, GroupedConversation]) => {
      const aIndex = a.flowStep?.order_index ?? 0;
      const bIndex = b.flowStep?.order_index ?? 0;
      return aIndex - bIndex;
    });

  return (
    <div className="space-y-4">
      {sortedGroups.map(([stepId, group]: [string, GroupedConversation]) => (
        <Card key={`${group.agent?.id}-${stepId}`} className="overflow-hidden border-agent">
          <CardContent>
            <ConversationGroup
              group={group}
              index={group.flowStep?.order_index ?? 0}
              isPlaying={isPlaying}
              audioElements={audioElements}
              visibleTexts={visibleTexts}
              visibleStructuredOutputs={visibleStructuredOutputs}
              onPlayStateChange={handlePlayStateChange}
              onAudioElement={handleAudioElement}
              onToggleText={toggleText}
              onToggleStructuredOutput={toggleStructuredOutput}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};