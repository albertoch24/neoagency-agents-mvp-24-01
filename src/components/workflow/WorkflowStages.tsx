import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";

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
}

export function WorkflowStages({ stages, currentStage, onStageSelect, disabled }: WorkflowStagesProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        // Skip rendering if stage is empty or invalid
        if (!stage.name || !stage.description) {
          return null;
        }

        // Determine icon based on stage name or default to Flag
        const iconKey = stage.name.toLowerCase().includes("kick") ? "flag" :
                       stage.name.toLowerCase().includes("insight") ? "search" :
                       stage.name.toLowerCase().includes("concept") ? "lightbulb" :
                       stage.name.toLowerCase().includes("storyboard") ? "film" :
                       "target";
                       
        const Icon = iconMap[iconKey as keyof typeof iconMap];
        const isActive = currentStage === stage.id;
        const isCompleted = index < currentStageIndex;
        const isNext = index === currentStageIndex + 1;

        return (
          <Card
            key={stage.id}
            className={cn(
              "transition-all",
              isActive && "border-primary",
              isCompleted && "bg-muted",
              !disabled && "hover:shadow-md cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onStageSelect(stage)}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5" />
                {stage.name}
                {isCompleted && (
                  <Badge variant="secondary" className="ml-auto">
                    Completed
                  </Badge>
                )}
                {isNext && (
                  <Badge variant="outline" className="ml-auto">
                    Next
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}