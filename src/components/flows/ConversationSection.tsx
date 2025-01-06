import { ConversationContent } from "./ConversationContent";

interface ConversationSectionProps {
  title: string;
  conversations: any[];
  isPlaying: { [key: string]: boolean };
  visibleTexts: { [key: string]: boolean };
  visibleStructuredOutputs: { [key: string]: boolean };
  onPlayStateChange: (convId: string, playing: boolean) => void;
  onAudioElement: (convId: string, audio: HTMLAudioElement | null) => void;
  onToggleText: (convId: string) => void;
  onToggleStructuredOutput: (stepId: string) => void;
}

export const ConversationSection = ({
  title,
  conversations,
  isPlaying,
  visibleTexts,
  visibleStructuredOutputs,
  onPlayStateChange,
  onAudioElement,
  onToggleText,
  onToggleStructuredOutput,
}: ConversationSectionProps) => {
  if (!conversations.length) return null;

  return (
    <div className="space-y-4 mt-8">
      <h4 className="text-lg font-semibold text-primary">{title}</h4>
      {conversations.map((conv: any) => (
        <div key={conv.id} className="space-y-4">
          <ConversationContent
            conversation={conv}
            isPlaying={isPlaying[conv.id]}
            visibleText={visibleTexts[conv.id]}
            visibleStructuredOutput={visibleStructuredOutputs[conv.flow_step_id] || false}
            onPlayStateChange={(playing) => onPlayStateChange(conv.id, playing)}
            onAudioElement={(audio) => onAudioElement(conv.id, audio)}
            onToggleText={() => onToggleText(conv.id)}
            onToggleStructuredOutput={() => onToggleStructuredOutput(conv.flow_step_id)}
          />
        </div>
      ))}
    </div>
  );
};