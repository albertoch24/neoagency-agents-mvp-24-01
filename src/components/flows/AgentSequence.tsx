import { Card, CardContent } from "@/components/ui/card";
import { AgentSkills } from "./AgentSkills";
import { useState } from "react";
import { AgentHeader } from "./AgentHeader";
import { ConversationContent } from "./ConversationContent";
import { MarkdownContent } from "./MarkdownContent";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations = [] }: AgentSequenceProps) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement | null}>({});
  const [visibleTexts, setVisibleTexts] = useState<{[key: string]: boolean}>({});

  // Sort conversations by creation date and step order
  const sortedConversations = [...conversations].sort((a, b) => {
    // First sort by flow step order if available
    if (a.flow_step_id && b.flow_step_id) {
      return a.order_index - b.order_index;
    }
    // Fall back to creation date
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const groupedConversations = sortedConversations.reduce((acc: any, conv: any) => {
    if (!conv) return acc;
    
    const agentId = conv.agent_id;
    if (!acc[agentId]) {
      acc[agentId] = {
        agent: conv.agents || { id: agentId, name: 'Unknown Agent' },
        conversations: [],
        summary: null
      };
    }
    
    if (conv.output_type === 'summary') {
      acc[agentId].summary = conv;
    } else {
      acc[agentId].conversations.push(conv);
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

  return (
    <div className="space-y-4">
      {Object.entries(groupedConversations).map(([agentId, group]: [string, any], index: number) => {
        if (!group?.agent) return null;
        
        return (
          <Card key={group.agent?.id || `unknown-${index}`} className="overflow-hidden border-agent">
            <CardContent className="p-4">
              <AgentHeader agentName={group.agent?.name} index={index} />
              
              <div className="pl-6 space-y-6">
                <div>
                  <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
                  <AgentSkills skills={group.agent?.skills || []} />
                </div>
                
                {/* Display conversations first */}
                {group.conversations.map((conv: any) => (
                  <div key={conv.id}>
                    <ConversationContent
                      conversation={conv}
                      isPlaying={isPlaying[conv.id]}
                      onPlayStateChange={(playing) => handlePlayStateChange(conv.id, playing)}
                      onAudioElement={(audio) => handleAudioElement(conv.id, audio)}
                      visibleText={visibleTexts[conv.id]}
                      onToggleText={() => toggleText(conv.id)}
                    />
                  </div>
                ))}

                {/* Display summary if available */}
                {group.summary && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Summary:</h5>
                    </div>
                    <div className="bg-muted rounded-lg p-6">
                      <MarkdownContent content={group.summary.content} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};