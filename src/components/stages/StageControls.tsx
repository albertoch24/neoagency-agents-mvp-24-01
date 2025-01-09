import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { Stage } from "@/types/workflow";

interface StageControlsProps {
  stage: Stage;
  index: number;
  totalStages: number;
  onMove: (stageId: string, direction: "up" | "down") => void;
  onEdit: (stage: Stage) => void;
  onDelete: (stageId: string) => void;
  isTemplate?: boolean;
}

export const StageControls = ({
  stage,
  index,
  totalStages,
  onMove,
  onEdit,
  onDelete,
  isTemplate = false,
}: StageControlsProps) => {
  if (!isTemplate) return null;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove(stage.id, "up")}
        disabled={index === 0}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove(stage.id, "down")}
        disabled={index === totalStages - 1}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => onEdit(stage)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onDelete(stage.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
};