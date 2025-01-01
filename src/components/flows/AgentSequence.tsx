import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useState } from "react";
import { TextToSpeechButton } from "./TextToSpeechButton";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement | null}>({});

  // Group conversations by agent and type
  const groupedConversations = conversations.reduce((acc: any, conv: any) => {
    const agentId = conv.agent_id;
    if (!acc[agentId]) {
      acc[agentId] = {
        agent: conv.agents,
        conversational: null,
        summary: null
      };
    }
    if (conv.output_type === 'conversational') {
      acc[agentId].conversational = conv;
    } else if (conv.output_type === 'summary') {
      acc[agentId].summary = conv;
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

  return (
    <div className="space-y-4">
      {Object.values(groupedConversations).map((group: any, index: number) => (
        <Card key={group.agent.id} className="overflow-hidden border-agent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <User className="h-5 w-5 text-agent" />
              <span className="font-semibold text-lg">
                {group.agent?.name || 'Unknown Agent'}
              </span>
              <Badge variant="outline" className="ml-auto">
                Step {index + 1}
              </Badge>
            </div>
            
            <div className="pl-6 space-y-6">
              <div>
                <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
                <AgentSkills skills={group.agent?.skills} />
              </div>
              
              {group.conversational && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Agent Output:</h5>
                    <TextToSpeechButton
                      text={group.conversational.content}
                      convId={group.conversational.id}
                      isPlaying={isPlaying[group.conversational.id]}
                      onPlayStateChange={(playing) => handlePlayStateChange(group.conversational.id, playing)}
                      onAudioElement={(audio) => handleAudioElement(group.conversational.id, audio)}
                    />
                  </div>
                  <div className="bg-agent/5 rounded-lg p-6 shadow-sm">
                    <div className={`prose prose-sm max-w-none dark:prose-invert 
                      prose-p:text-foreground/90 prose-headings:text-foreground
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-li:text-foreground/90 prose-a:text-primary
                      [&>p]:leading-7 [&>ul]:mt-4 [&>ul]:list-none [&>ul]:pl-0
                      [&>ul>li]:relative [&>ul>li]:pl-4 ${isPlaying[group.conversational.id] ? 'hidden' : ''}`}>
                      <ReactMarkdown>{group.conversational.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {group.summary && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Summary:</h5>
                    <TextToSpeechButton
                      text={group.summary.content}
                      convId={group.summary.id}
                      isPlaying={isPlaying[group.summary.id]}
                      onPlayStateChange={(playing) => handlePlayStateChange(group.summary.id, playing)}
                      onAudioElement={(audio) => handleAudioElement(group.summary.id, audio)}
                    />
                  </div>
                  <div className="bg-muted rounded-lg p-6">
                    <div className={`prose prose-sm max-w-none dark:prose-invert ${isPlaying[group.summary.id] ? 'hidden' : ''}`}>
                      <ReactMarkdown>{group.summary.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};