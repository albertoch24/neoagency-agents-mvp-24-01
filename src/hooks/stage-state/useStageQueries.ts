import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StageData } from "./types";

export const useStageQueries = (briefId?: string, stageId?: string) => {
  return useQuery({
    queryKey: ["stage-state", briefId, stageId],
    queryFn: async () => {
      console.log('🔍 Checking stage state:', {
        briefId,
        stageId,
        timestamp: new Date().toISOString()
      });

      if (!briefId || !stageId) {
        console.error('❌ Missing required parameters:', { briefId, stageId });
        throw new Error('Missing briefId or stageId');
      }

      // Verify brief exists
      const { data: brief, error: briefError } = await supabase
        .from('briefs')
        .select('*')
        .eq('id', briefId)
        .maybeSingle();

      if (briefError) {
        console.error('❌ Error fetching brief:', briefError);
        throw briefError;
      }

      if (!brief) {
        console.error('❌ Brief not found:', briefId);
        throw new Error('Brief not found');
      }

      // Check for outputs
      const { data: outputs, error: outputsError } = await supabase
        .from('brief_outputs')
        .select('*')
        .eq('brief_id', briefId)
        .eq('stage_id', stageId);

      if (outputsError) {
        console.error('❌ Error fetching outputs:', outputsError);
        throw outputsError;
      }

      // Check for conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('workflow_conversations')
        .select('*')
        .eq('brief_id', briefId)
        .eq('stage_id', stageId);

      if (conversationsError) {
        console.error('❌ Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      return {
        outputs,
        conversations
      } as StageData;
    },
    enabled: !!briefId && !!stageId,
    refetchInterval: 5000 // Check every 5 seconds
  });
};