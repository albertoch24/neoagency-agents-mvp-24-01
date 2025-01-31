import { ConversationContent } from "./ConversationContent";

interface ConversationSectionProps {
  title: string;
  conversations: any[];
  isPlaying: { [key: string]: boolean };
  visibleTexts: { [key: string]: boolean };
  onPlayStateChange: (convId: string, playing: boolean) => void;
  onAudioElement: (convId: string, audio: HTMLAudioElement | null) => void;
  onToggleText: (convId: string) => void;
}

export const ConversationSection = ({
  title,
  conversations,
  isPlaying,
  visibleTexts,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
}: ConversationSectionProps) => {
  // Filter out structured outputs
  const conversationalOutputs = conversations.filter(conv => conv.output_type === 'conversational');
  
  if (!conversationalOutputs.length) return null;

  return (
    <div className="space-y-4 mt-8">
      <h4 className="text-lg font-semibold text-primary">{title}</h4>
      {conversationalOutputs.map((conv: any) => (
        <div key={conv.id} className="space-y-4">
          <ConversationContent
            content={conv.content}
            isPlaying={isPlaying[conv.id]}
            visibleText={visibleTexts[conv.id]}
            onPlayStateChange={(playing) => onPlayStateChange(conv.id, playing)}
            onAudioElement={(audio) => onAudioElement(conv.id, audio)}
            onToggleText={() => onToggleText(conv.id)}
          />
        </div>
      ))}
    </div>
  );
};