import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StageState {
  isLoading: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error: Error | null;
}

export const useStageState = (briefId?: string, stageId?: string) => {
  const [state, setState] = useState<StageState>({
    isLoading: true,
    isCompleted: false,
    hasError: false,
    error: null
  });
  const queryClient = useQueryClient();

  const { data: stageData, error: stageError } = useQuery({
    queryKey: ['stage-state', briefId, stageId],
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

      console.log('✅ Stage state check complete:', {
        hasOutputs: outputs?.length > 0,
        hasConversations: conversations?.length > 0,
        timestamp: new Date().toISOString()
      });

      return {
        outputs,
        conversations,
        brief
      };
    },
    enabled: !!briefId && !!stageId,
    refetchInterval: 5000 // Check every 5 seconds
  });

  useEffect(() => {
    if (stageError) {
      console.error('❌ Stage state query error:', stageError);
      setState(prev => ({
        ...prev,
        hasError: true,
        error: stageError as Error,
        isLoading: false
      }));
      toast.error('Error checking stage state');
      return;
    }

    if (stageData) {
      // A stage is considered completed if it has both outputs and conversations
      const isCompleted = 
        stageData.outputs?.length > 0 && 
        stageData.conversations?.length > 0;

      console.log('🔄 Updating stage state:', {
        briefId,
        stageId,
        isCompleted,
        timestamp: new Date().toISOString()
      });

      setState({
        isLoading: false,
        isCompleted,
        hasError: false,
        error: null
      });
    }
  }, [stageData, stageError, briefId, stageId]);

  const refreshState = async () => {
    console.log('🔄 Manually refreshing stage state');
    await queryClient.invalidateQueries({ queryKey: ['stage-state', briefId, stageId] });
  };

  return {
    ...state,
    refreshState
  };
};