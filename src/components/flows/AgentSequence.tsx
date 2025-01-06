import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { ConversationGroup } from "./ConversationGroup";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations = [] }: AgentSequenceProps) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement | null}>({});
  const [visibleTexts, setVisibleTexts] = useState<{[key: string]: boolean}>({});
  const [visibleStructuredOutputs, setVisibleStructuredOutputs] = useState<{[key: string]: boolean}>(() => {
    // Initialize all structured outputs as visible by default
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
    if (a.flow_step_id && b.flow_step_id) {
      return a.order_index - b.order_index;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Group conversations by flow step ID to maintain step order
  const groupedConversations = sortedConversations.reduce((acc: any, conv: any) => {
    if (!conv) return acc;
    
    const stepId = conv.flow_step_id || `no-step-${conv.id}`;
    if (!acc[stepId]) {
      acc[stepId] = {
        agent: conv.agents || { id: conv.agent_id, name: 'Unknown Agent' },
        conversations: [],
        summary: null,
        orderIndex: conv.order_index,
        briefId: conv.brief_id,
        stageId: conv.stage_id
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
    .sort(([, a]: [string, any], [, b]: [string, any]) => 
      (a.orderIndex || 0) - (b.orderIndex || 0)
    );

  return (
    <div className="space-y-4">
      {sortedGroups.map(([stepId, group]: [string, any], index: number) => (
        <Card key={`${group.agent?.id}-${stepId}`} className="overflow-hidden border-agent">
          <CardContent>
            <ConversationGroup
              group={group}
              index={index}
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