import { ConversationContent } from "./ConversationContent";
import { AgentHeader } from "./AgentHeader";
import { AgentSkills } from "./AgentSkills";
import { StageSummary } from "./StageSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StructuredOutput } from "./StructuredOutput";
import { ConversationSection } from "./ConversationSection";
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
  const { data: briefOutput } = useQuery<DatabaseBriefOutput | null>({
    queryKey: ["brief-outputs", group.briefId, group.stageId],
    queryFn: async () => {
      console.log("Fetching brief outputs for:", { 
        briefId: group.briefId, 
        stageId: group.stageId,
        group: group
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

        {briefOutput && (
          <StructuredOutput 
            content={briefOutput.content} 
            stepId={group.conversations[0]?.flow_step_id}
          />
        )}
        
        {/* Structured Output Section */}
        <ConversationSection
          title="Analisi Strutturata"
          conversations={structuredOutputs}
          isPlaying={isPlaying}
          visibleTexts={visibleTexts}
          onPlayStateChange={onPlayStateChange}
          onAudioElement={onAudioElement}
          onToggleText={onToggleText}
        />

        {/* Conversational Output Section */}
        <ConversationSection
          title="Conversazione Dettagliata"
          conversations={conversationalOutputs}
          isPlaying={isPlaying}
          visibleTexts={visibleTexts}
          onPlayStateChange={onPlayStateChange}
          onAudioElement={onAudioElement}
          onToggleText={onToggleText}
        />

        <StageSummary summary={group.summary} />
      </div>
    </div>
  );
};