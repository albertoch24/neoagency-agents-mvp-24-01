import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StageCard } from "./StageCard";
import { WorkflowStage } from "@/types/workflow";

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
  // Query to check completed stages
  const { data: completedStages } = useQuery({
    queryKey: ["completed-stages", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
      const { data } = await supabase
        .from("workflow_conversations")
        .select("stage_id")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
      
      return data?.map(item => item.stage_id) || [];
    },
    enabled: !!briefId
  });

  // Query to fetch flow steps for each stage
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

  const handleStageClick = async (stage: WorkflowStage, index: number) => {
    if (disabled) return;

    console.log("Stage clicked:", stage.id, "Current stage:", currentStage);

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const isCompleted = completedStages?.includes(stage.id);
    const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
    const isNextStage = index === currentIndex + 1;

    // Allow selecting completed stages or the next available stage
    if (isCompleted || isPreviousCompleted) {
      console.log("Selecting stage:", stage.id);
      onStageSelect(stage);
    } else {
      console.log("Stage selection blocked - Completed:", isCompleted, "Previous completed:", isPreviousCompleted);
      toast.error("Please complete the previous stage first");
    }
  };

  if (!stages || stages.length === 0) {
    return null;
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        if (!stage.name || !stage.description) {
          return null;
        }

        const isActive = currentStage === stage.id;
        const isCompleted = completedStages?.includes(stage.id);
        const isNext = index === currentStageIndex + 1;
        const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
        const isClickable = !disabled && (isCompleted || isPreviousCompleted);
        const flowStepsCount = stageFlowSteps?.flows?.flow_steps?.length || 0;

        return (
          <StageCard
            key={stage.id}
            stage={stage}
            index={index}
            isActive={isActive}
            isCompleted={isCompleted}
            isNext={isNext}
            isClickable={isClickable}
            disabled={!!disabled}
            flowStepsCount={flowStepsCount}
            onClick={() => handleStageClick(stage, index)}
          />
        );
      })}
    </div>
  );
}