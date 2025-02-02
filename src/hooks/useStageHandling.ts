import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { resolveStageId } from "@/services/stage/resolveStageId";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface StageHandlingResult {
  data?: Stage;
  isLoading: boolean;
  error: Error | null;
  currentStage: string;
  handleStageSelect: (stage: Stage) => void;
}

export const useStageHandling = (initialStageId: string): StageHandlingResult => {
  const [currentStage, setCurrentStage] = useState<string>(initialStageId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentStage !== initialStageId) {
      console.log('🔄 Stage changed in useStageHandling:', {
        from: initialStageId,
        to: currentStage,
        timestamp: new Date().toISOString()
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['stage', initialStageId]
      });
      setCurrentStage(initialStageId);
    }
  }, [initialStageId, currentStage, queryClient]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stage", currentStage],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching stage data:', {
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });

        const resolvedStageId = await resolveStageId(currentStage);
        
        if (!resolvedStageId) {
          console.error('❌ Stage not found:', {
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });
          throw new Error('Stage not found');
        }

        console.log('✅ Stage ID resolved:', {
          originalId: currentStage,
          resolvedId: resolvedStageId,
          timestamp: new Date().toISOString()
        });

        const { data: stages, error: stagesError } = await supabase
          .from("stages")
          .select(`
            id,
            name,
            description,
            order_index,
            user_id,
            flow_id,
            flows (
              id,
              name,
              description,
              flow_steps (
                id,
                order_index,
                agent_id,
                requirements,
                outputs,
                agents (
                  id,
                  name,
                  description
                )
              )
            )
          `)
          .eq("id", resolvedStageId)
          .single();

        if (stagesError) {
          console.error('❌ Error fetching stage data:', {
            error: stagesError,
            stageId: resolvedStageId,
            timestamp: new Date().toISOString()
          });
          throw stagesError;
        }

        if (!stages) {
          console.error('❌ Stage data not found:', {
            stageId: resolvedStageId,
            timestamp: new Date().toISOString()
          });
          throw new Error('Stage data not found');
        }

        console.log('✅ Stage data fetched:', {
          stageId: resolvedStageId,
          stageName: stages.name,
          timestamp: new Date().toISOString()
        });

        const transformedStage: Stage = {
          id: stages.id,
          name: stages.name,
          description: stages.description,
          order_index: stages.order_index,
          user_id: stages.user_id,
          flow_id: stages.flow_id,
          flows: stages.flows ? {
            id: stages.flows.id,
            name: stages.flows.name,
            description: stages.flows.description,
            flow_steps: stages.flows.flow_steps?.map(step => ({
              id: step.id,
              agent_id: step.agent_id,
              requirements: step.requirements || '',
              order_index: step.order_index,
              outputs: step.outputs || [],
              agents: step.agents ? {
                id: step.agents.id,
                name: step.agents.name,
                description: step.agents.description
              } : undefined
            })) || []
          } : null
        };

        return transformedStage;
      } catch (error: any) {
        console.error('❌ Error fetching stage data:', {
          error,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });
        toast.error(`Error loading stage: ${error.message}`);
        throw error;
      }
    },
    gcTime: 1000 * 60 * 5, // Keep in garbage collection for 5 minutes
    staleTime: 0 // Always fetch fresh data
  });

  const handleStageSelect = useCallback((stage: Stage | null) => {
    if (!stage) {
      console.warn('⚠️ Attempted to select null stage');
      return;
    }

    console.log('🔄 Stage selected:', {
      stageId: stage.id,
      stageName: stage.name,
      timestamp: new Date().toISOString()
    });
    setCurrentStage(stage.id);
  }, []);

  return {
    data,
    isLoading,
    error,
    currentStage,
    handleStageSelect
  };
};