import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface StageHeaderProps {
  stage: {
    name: string;
    description: string | null;
    flows?: {
      name: string;
    } | null;
  };
  isActive: boolean;
  isCompleted: boolean;
}

export const StageHeader = ({ stage, isActive, isCompleted }: StageHeaderProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{stage.name}</h3>
        {isActive && (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        )}
        {isCompleted && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
      </div>
      {stage.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">{stage.description}</p>
      )}
    </div>
  );
};