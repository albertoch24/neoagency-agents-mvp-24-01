import { ConversationContent } from "./ConversationContent";
import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { StageSummary } from "./StageSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownContent } from "./MarkdownContent";

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
  const { data: briefOutput } = useQuery({
    queryKey: ["brief-outputs", group.briefId, group.stageId],
    queryFn: async () => {
      console.log("Fetching brief outputs for:", { 
        briefId: group.briefId, 
        stageId: group.stageId,
        group: group // Log the entire group for debugging
      });
      
      if (!group.briefId || !group.stageId) {
        console.log("Missing briefId or stageId:", { briefId: group.briefId, stageId: group.stageId });
        return null;
      }

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", group.briefId)
        .eq("stage", group.stageId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.error("Error fetching brief outputs:", error);
        return null;
      }

      console.log("Found brief output:", data);
      return data;
    },
    enabled: !!group.briefId && !!group.stageId
  });

  if (!group?.agent) return null;

  // Separate conversations by type
  const conversationalOutputs = group.conversations.filter((conv: any) => conv.output_type === 'conversational');
  const structuredOutputs = group.conversations.filter((conv: any) => conv.output_type === 'structured');

  return (
    <div className="p-4">
      <AgentHeader agentName={group.agent?.name} index={index} />
      
      <div className="pl-6 space-y-6">
        <div>
          <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
          <AgentSkills skills={group.agent?.skills || []} />
        </div>

        {briefOutput && briefOutput.content && (
          <div className="mb-6">
            <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Output Strutturato
              </h4>
              <div className="prose prose-sm max-w-none">
                <MarkdownContent content={String(JSON.stringify(briefOutput.content, null, 2))} />
              </div>
            </div>
          </div>
        )}
        
        {/* Structured Output Section */}
        {structuredOutputs.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-primary">Analisi Strutturata</h4>
            {structuredOutputs.map((conv: any) => (
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
          </div>
        )}

        {/* Conversational Output Section */}
        {conversationalOutputs.length > 0 && (
          <div className="space-y-4 mt-8">
            <h4 className="text-lg font-semibold text-primary">Conversazione Dettagliata</h4>
            {conversationalOutputs.map((conv: any) => (
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
          </div>
        )}

        <StageSummary summary={group.summary} />
      </div>
    </div>
  );
};