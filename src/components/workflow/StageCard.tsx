import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";

const iconMap = {
  flag: Flag,
  search: Search,
  lightbulb: Lightbulb,
  film: Film,
  target: Target,
};

interface StageCardProps {
  stage: WorkflowStage;
  isActive: boolean;
  isCompleted: boolean;
  isNext: boolean;
  isClickable: boolean;
  disabled?: boolean;
  onClick: () => void;
  flowStepsCount?: number;
}

export function StageCard({
  stage,
  isActive,
  isCompleted,
  isNext,
  isClickable,
  disabled,
  onClick,
  flowStepsCount,
}: StageCardProps) {
  const iconKey = stage.name.toLowerCase().includes("kick") ? "flag" :
                 stage.name.toLowerCase().includes("insight") ? "search" :
                 stage.name.toLowerCase().includes("concept") ? "lightbulb" :
                 stage.name.toLowerCase().includes("storyboard") ? "film" :
                 "target";
                 
  const Icon = iconMap[iconKey as keyof typeof iconMap];

  return (
    <Card
      className={cn(
        "transition-all",
        isActive && "border-primary",
        isCompleted && "bg-muted",
        isClickable && "hover:shadow-md cursor-pointer",
        (!isClickable || disabled) && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
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
}