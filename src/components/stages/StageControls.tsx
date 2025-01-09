import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Stage } from "@/types/workflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StageControlsProps {
  stage: Stage;
  index: number;
  totalStages: number;
  onMove: (stageId: string, newIndex: number) => void;
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

  const handleOrderChange = (value: string) => {
    const newIndex = parseInt(value) - 1; // Convert to 0-based index
    onMove(stage.id, newIndex);
  };

  return (
    <>
      <Select
        value={(index + 1).toString()}
        onValueChange={handleOrderChange}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: Math.min(10, totalStages) }, (_, i) => (
            <SelectItem key={i + 1} value={(i + 1).toString()}>
              Stage {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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