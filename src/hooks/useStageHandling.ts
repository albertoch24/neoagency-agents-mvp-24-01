import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { resolveStageId } from "@/services/stage/resolveStageId";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export const useStageHandling = (initialStageId: string): {
  data?: Stage;
  isLoading: boolean;
  error: Error | null;
  currentStage: string;
  handleStageSelect: (stage: Stage) => void;
} => {
  const [currentStage, setCurrentStage] = useState<string>(initialStageId);
  const queryClient = useQueryClient();
  const { stageId } = useParams();

  useEffect(() => {
    console.log('🔄 Stage Handling Effect:', {
      initialStageId,
      currentStage,
      urlStageId: stageId,
      timestamp: new Date().toISOString()
    });

    if (stageId && stageId !== currentStage) {
      console.log('📍 Updating stage from URL:', {
        from: currentStage,
        to: stageId,
        timestamp: new Date().toISOString()
      });
      setCurrentStage(stageId);
    }
  }, [stageId, currentStage, initialStageId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stage", currentStage],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching stage data:', {
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });

        const { data: stageCheck, error: checkError } = await supabase
          .from("stages")
          .select("id")
          .eq("id", currentStage)
          .maybeSingle();

        if (!stageCheck) {
          console.log('⚠️ Stage not found directly, attempting resolution:', {
            originalId: currentStage,
            error: checkError?.message,
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

          setCurrentStage(resolvedStageId);
        }

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
          .eq("id", stageCheck?.id || currentStage)
          .maybeSingle();

        if (stagesError) {
          console.error('❌ Error fetching stage data:', {
            error: stagesError,
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });
          throw stagesError;
        }

        if (!stages) {
          console.error('❌ Stage data not found:', {
            stageId: currentStage,
            timestamp: new Date().toISOString()
          });
          throw new Error('Stage data not found');
        }

        console.log('✅ Stage data fetched:', {
          stageId: stages.id,
          stageName: stages.name,
          timestamp: new Date().toISOString()
        });

        return {
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
      } catch (error: any) {
        console.error('❌ Error in stage query:', {
          error,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });
        toast.error(`Error loading stage: ${error.message}`);
        throw error;
      }
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 0,
    retry: false
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