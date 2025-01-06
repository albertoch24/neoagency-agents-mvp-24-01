import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStage } from "@/types/workflow";
import { StageGrid } from "./StageGrid";

interface WorkflowStagesProps {
  stages: WorkflowStage[];
  currentStage: string;
  onStageSelect: (stage: WorkflowStage) => void;
  disabled?: boolean;
  briefId?: string;
}

export function WorkflowStages({ 
  stages, 
  currentStage, 
  onStageSelect, 
  disabled, 
  briefId 
}: WorkflowStagesProps) {
  // Query to fetch flow steps for the current stage
  const { data: stageFlowSteps } = useQuery({
    queryKey: ["stage-flow-steps", currentStage],
    queryFn: async () => {
      if (!currentStage || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentStage)) {
        console.log("Invalid stage ID format:", currentStage);
        return null;
      }

      console.log("Fetching flow steps for stage:", currentStage);
      
      try {
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select(`
            *,
            flows (
              id,
              name,
              flow_steps (
                id,
                agent_id,
                requirements,
                order_index,
                outputs,
                agents (
                  id,
                  name,
                  description
                )
              )
            )
          `)
          .eq("id", currentStage)
          .single();

        if (stageError) {
          console.error("Error fetching stage flow steps:", stageError);
          return null;
        }

        console.log("Stage data with flow steps:", stageData);
        return stageData;
      } catch (error) {
        console.error("Error in stage flow steps query:", error);
        return null;
      }
    },
    enabled: !!currentStage
  });

  // Query to check completed stages
  const { data: completedStages } = useQuery({
    queryKey: ["completed-stages", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
      console.log("Fetching completed stages for brief:", briefId);
      
      const { data: conversations, error } = await supabase
        .from("workflow_conversations")
        .select("stage_id")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching completed stages:", error);
        return [];
      }
      
      const completedStageIds = conversations?.map(item => item.stage_id) || [];
      console.log("Completed stage IDs:", completedStageIds);
      return completedStageIds;
    },
    enabled: !!briefId
  });

  if (!stages || stages.length === 0) {
    console.log("No stages available");
    return null;
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  console.log("Current stage index:", currentStageIndex);

  return (
    <StageGrid
      stages={stages}
      currentStage={currentStage}
      completedStages={completedStages}
      onStageSelect={onStageSelect}
      disabled={disabled}
      stageFlowSteps={stageFlowSteps}
      currentStageIndex={currentStageIndex}
    />
  );
}