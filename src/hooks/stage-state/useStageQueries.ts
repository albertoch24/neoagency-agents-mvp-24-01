import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StageData } from "./types";

export const useStageQueries = (briefId?: string, stageId?: string) => {
  return useQuery({
    queryKey: ["stage-state", briefId, stageId],
    queryFn: async () => {
      console.log('🔍 Starting stage state check:', {
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

      console.log('📊 Outputs check:', {
        briefId,
        stageId,
        outputsCount: outputs?.length || 0,
        outputIds: outputs?.map(o => o.id),
        timestamp: new Date().toISOString()
      });

      // Check for conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('workflow_conversations')
        .select(`
          *,
          agents (
            id,
            name
          )
        `)
        .eq('brief_id', briefId)
        .eq('stage_id', stageId);

      if (conversationsError) {
        console.error('❌ Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      console.log('💬 Conversations check:', {
        briefId,
        stageId,
        conversationsCount: conversations?.length || 0,
        conversationDetails: conversations?.map(c => ({
          id: c.id,
          agentId: c.agent_id,
          agentName: c.agents?.name,
          hasContent: !!c.content,
          contentLength: c.content?.length || 0,
          timestamp: c.created_at
        })),
        timestamp: new Date().toISOString()
      });

      // Verify stage_id consistency
      const outputStageIds = new Set(outputs?.map(o => o.stage_id));
      const conversationStageIds = new Set(conversations?.map(c => c.stage_id));

      console.log('🔄 Stage ID consistency check:', {
        briefId,
        stageId,
        outputStageIds: Array.from(outputStageIds),
        conversationStageIds: Array.from(conversationStageIds),
        isConsistent: 
          outputStageIds.size === 1 && 
          conversationStageIds.size === 1 && 
          outputStageIds.has(stageId) && 
          conversationStageIds.has(stageId),
        timestamp: new Date().toISOString()
      });

      // Check timing of updates
      const latestOutputTime = outputs?.length 
        ? Math.max(...outputs.map(o => new Date(o.created_at).getTime()))
        : null;
      
      const latestConversationTime = conversations?.length
        ? Math.max(...conversations.map(c => new Date(c.created_at).getTime()))
        : null;

      console.log('⏱️ Timing analysis:', {
        briefId,
        stageId,
        latestOutputTime: latestOutputTime ? new Date(latestOutputTime).toISOString() : null,
        latestConversationTime: latestConversationTime ? new Date(latestConversationTime).toISOString() : null,
        timeDifferenceMs: latestOutputTime && latestConversationTime 
          ? Math.abs(latestOutputTime - latestConversationTime)
          : null,
        timestamp: new Date().toISOString()
      });

      return {
        outputs,
        conversations
      } as StageData;
    },
    enabled: !!briefId && !!stageId,
    refetchInterval: 5000 // Check every 5 seconds
  });
};