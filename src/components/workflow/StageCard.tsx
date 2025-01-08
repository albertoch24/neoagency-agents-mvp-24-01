import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Stage } from "@/types/workflow";
import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";

const iconMap = {
  flag: Flag,
  search: Search,
  lightbulb: Lightbulb,
  film: Film,
  target: Target,
};

interface StageCardProps {
  stage: Stage;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isNext: boolean;
  isClickable: boolean;
  disabled: boolean;
  flowStepsCount: number;
  onClick: () => void;
}

export const StageCard = ({
  stage,
  isActive,
  isCompleted,
  isNext,
  isClickable,
  disabled,
  flowStepsCount,
  onClick
}: StageCardProps) => {
  const iconKey = stage.name.toLowerCase().includes("kick") ? "flag" :
                 stage.name.toLowerCase().includes("insight") ? "search" :
                 stage.name.toLowerCase().includes("concept") ? "lightbulb" :
                 stage.name.toLowerCase().includes("storyboard") ? "film" :
                 "target";
                 
  const Icon = iconMap[iconKey as keyof typeof iconMap];

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer relative",
        isActive && "border-primary",
        isCompleted && "bg-muted",
        isClickable && "hover:shadow-md",
        (!isClickable || disabled) && "opacity-50"
      )}
      onClick={onClick}
    >
      {/* Badge Container at the top */}
      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-2">
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

      <CardHeader className="space-y-1 pt-6">
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "h-5 w-5",
            isCompleted && "text-green-500"
          )} />
          <CardTitle className="text-lg">
            {stage.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{stage.description}</p>
        {isActive && flowStepsCount > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Steps: {flowStepsCount}
          </p>
        )}
      </CardContent>
    </Card>
  );
};