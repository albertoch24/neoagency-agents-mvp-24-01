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

export function WorkflowStages({ 
  stages, 
  currentStage, 
  onStageSelect, 
  disabled, 
  briefId 
}: WorkflowStagesProps) {
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
      
      const { data } = await supabase
        .from("workflow_conversations")
        .select("stage_id")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
      
      return data?.map(item => item.stage_id) || [];
    },
    enabled: !!briefId
  });

  const handleStageClick = async (stage: WorkflowStage, index: number) => {
    if (disabled) return;

    console.log("Stage clicked:", stage.id, "Current stage:", currentStage);

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const isCompleted = completedStages?.includes(stage.id);
    const isPreviousCompleted = index > 0 ? completedStages?.includes(stages[index - 1].id) : true;
    const isNextStage = index === currentIndex + 1;

    // Allow clicking on completed stages or the next stage if previous is completed
    if (isCompleted || (isPreviousCompleted && isNextStage)) {
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

        // Get flow steps count for the current stage
        const flowStepsCount = stageFlowSteps?.flows?.flow_steps?.length || 0;

        return (
          <Card
            key={stage.id}
            className={cn(
              "transition-all cursor-pointer",
              isActive && "border-primary",
              isCompleted && "bg-muted",
              isClickable && "hover:shadow-md",
              (!isClickable || disabled) && "opacity-50"
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