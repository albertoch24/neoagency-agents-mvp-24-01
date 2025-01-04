import { ConversationContent } from "./ConversationContent";
import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { StageSummary } from "./StageSummary";

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
  if (!group?.agent) return null;

  return (
    <div className="p-4">
      <AgentHeader agentName={group.agent?.name} index={index} />
      
      <div className="pl-6 space-y-6">
        <div>
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
          <AgentSkills skills={group.agent?.skills || []} />
        </div>
        
        {group.conversations.map((conv: any) => (
          <div key={conv.id} className="space-y-4">
            <ConversationContent
              conversation={conv}
              isPlaying={isPlaying[conv.id]}
              onPlayStateChange={(playing) => onPlayStateChange(conv.id, playing)}
              onAudioElement={(audio) => onAudioElement(conv.id, audio)}
              visibleText={visibleTexts[conv.id]}
              onToggleText={() => onToggleText(conv.id)}
            />
          </div>
        ))}

        <StageSummary summary={group.summary} />
      </div>
    </div>
  );
};