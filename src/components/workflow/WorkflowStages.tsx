import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iconMap = {
  flag: Flag,
  search: Search,
  lightbulb: Lightbulb,
  film: Film,
  target: Target,
};

interface WorkflowStagesProps {
  stages: WorkflowStage[];
  currentStage: string;
  onStageSelect: (stage: WorkflowStage) => void;
  disabled?: boolean;
  briefId?: string;
}

export function WorkflowStages({ stages, currentStage, onStageSelect, disabled, briefId }: WorkflowStagesProps) {
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

  const handleStageClick = (stage: WorkflowStage, index: number) => {
    if (disabled) {
      console.log("Stage selection disabled");
      return;
    }

    console.log("Handling stage click:", {
      stage,
      index,
      currentStage,
      completedStages
    });

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const isCompleted = completedStages?.includes(stage.id);
    const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
    const isNextStage = index === currentIndex + 1;

    console.log("Stage click validation:", {
      isCompleted,
      isPreviousCompleted,
      isNextStage
    });

    if (!isCompleted && !isPreviousCompleted) {
      toast.error("Please complete the previous stage first");
      return;
    }

    if (!isCompleted && !isNextStage) {
      toast.error("Please complete stages in order");
      return;
    }

    console.log("Stage selected:", stage);
    onStageSelect(stage);
  };

  if (!stages || stages.length === 0) {
    console.log("No stages available");
    return null;
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  console.log("Current stage index:", currentStageIndex);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        if (!stage.name || !stage.description) {
          console.log("Invalid stage data:", stage);
          return null;
        }

        const iconKey = stage.name.toLowerCase().includes("kick") ? "flag" :
                       stage.name.toLowerCase().includes("insight") ? "search" :
                       stage.name.toLowerCase().includes("concept") ? "lightbulb" :
                       stage.name.toLowerCase().includes("storyboard") ? "film" :
                       "target";
                       
        const Icon = iconMap[iconKey as keyof typeof iconMap];
        const isActive = currentStage === stage.id;
        const isCompleted = completedStages?.includes(stage.id);
        const isNext = index === currentStageIndex + 1;
        const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
        const isClickable = !disabled && (isCompleted || (isPreviousCompleted && isNext));

        console.log("Stage render data:", {
          stageName: stage.name,
          isActive,
          isCompleted,
          isNext,
          isPreviousCompleted,
          isClickable
        });

        // Get flow steps count for the current stage
        const flowStepsCount = stageFlowSteps?.flows?.flow_steps?.length || 0;

        return (
          <Card
            key={stage.id}
            className={cn(
              "transition-all",
              isActive && "border-primary",
              isCompleted && "bg-muted",
              isClickable && "hover:shadow-md cursor-pointer",
              (!isClickable || disabled) && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleStageClick(stage, index)}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className={cn(
                  "h-5 w-5",
                  isCompleted && "text-green-500"
                )} />
                {stage.name}
                {isCompleted && (
                  <Badge variant="secondary" className="ml-auto text-green-500 border-green-500">
                    Completed
                  </Badge>
                )}
                {isNext && !isCompleted && (
                  <Badge variant="outline" className="ml-auto">
                    Next
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
              {isActive && flowStepsCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Steps: {flowStepsCount}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}