import { Card } from "@/components/ui/card";
import { Stage } from "@/types/workflow";
import { StageHeader } from "./StageHeader";
import { cn } from "@/lib/utils";

interface StageCardProps {
  stage: Stage;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  canStart: boolean;
  totalStages: number;
  briefId: string;
  onStageClick: (stage: Stage) => void;
  onStageMove?: (stageId: string, direction: "up" | "down") => Promise<void>;
  onStageDelete?: (stageId: string) => Promise<void>;
}

export const StageCard = ({
  stage,
  index,
  isActive,
  isCompleted,
  canStart,
  totalStages,
  briefId,
  onStageClick,
}: StageCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary transition-colors min-w-[250px]",
        isActive && "border-primary"
      )}
      onClick={() => onStageClick(stage)}
    >
      <div className="p-4">
        <StageHeader
          stage={stage}
          isActive={isActive}
          isCompleted={isCompleted}
        />
      </div>
    </Card>
  );
};