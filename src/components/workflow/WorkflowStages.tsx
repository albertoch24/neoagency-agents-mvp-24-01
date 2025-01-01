import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

        return (
          <Card
            key={stage.id}
            className={cn(
              "transition-all h-full",
              isActive && "border-primary",
              isCompleted && "bg-muted",
              !disabled && "hover:shadow-md cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onStageSelect(stage)}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isCompleted && "text-green-500"
                  )} />
                  <span className="truncate">{stage.name}</span>
                </div>
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <Badge variant="secondary" className="text-green-500 border-green-500">
                      Completed
                    </Badge>
                  )}
                  {isNext && !isCompleted && (
                    <Badge variant="outline">
                      Next
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{stage.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}