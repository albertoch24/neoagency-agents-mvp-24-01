import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StageState } from './stage-state/types';
import { useStageQueries } from './stage-state/useStageQueries';
import { useStageCompletion } from './stage-state/useStageCompletion';
import { toast } from 'sonner';

export const useStageState = (briefId?: string, stageId?: string) => {
  const [state, setState] = useState<StageState>({
    isLoading: true,
    isCompleted: false,
    hasError: false,
    error: null
  });

  const queryClient = useQueryClient();
  const { data: stageData, error: stageError } = useStageQueries(briefId, stageId);
  const isCompleted = useStageCompletion(stageData);

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
  }, [stageData, stageError, briefId, stageId, isCompleted]);

  const refreshState = async () => {
    console.log('🔄 Manually refreshing stage state');
    await queryClient.invalidateQueries({ queryKey: ['stage-state', briefId, stageId] });
  };

  return {
    ...state,
    refreshState
  };
};