import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StageState } from './stage-state/types';
import { useStageQueries } from './stage-state/useStageQueries';
import { toast } from 'sonner';

export const useStageState = (briefId?: string, stageId?: string) => {
  const [state, setState] = useState<StageState>({
    isLoading: true,
    isCompleted: false,
    hasError: false,
    error: null,
    stageData: null
  });

  const queryClient = useQueryClient();
  const { data: stageData, error: stageError } = useStageQueries(briefId, stageId);

  useEffect(() => {
    if (stageError) {
      console.error('❌ Stage state query error:', stageError);
      setState(prev => ({
        ...prev,
        hasError: true,
        error: stageError as Error,
        isLoading: false
      }));
      toast.error('Errore durante la verifica dello stato dello stage');
      return;
    }

    if (stageData) {
      // Semplificazione: isCompleted è true se ci sono outputs
      const isCompleted = stageData.outputs && stageData.outputs.length > 0;

      console.log('🔄 Updating stage state:', {
        briefId,
        stageId,
        isCompleted,
        hasOutputs: stageData.outputs?.length > 0,
        timestamp: new Date().toISOString()
      });

      setState({
        isLoading: false,
        isCompleted,
        hasError: false,
        error: null,
        stageData
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