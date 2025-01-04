import { Button } from "@/components/ui/button";
import { FilePlus, Edit } from "lucide-react";

interface BriefActionsProps {
  currentBrief: any;
  showNewBrief: boolean;
  isEditing: boolean;
  onNewBrief: () => void;
  onEdit: () => void;
}

export const BriefActions = ({
  currentBrief,
  showNewBrief,
  isEditing,
  onNewBrief,
  onEdit,
}: BriefActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onNewBrief}
        className="flex items-center gap-2"
      >
        <FilePlus className="h-4 w-4" />
        Start with a new brief
      </Button>
      {currentBrief && !showNewBrief && !isEditing && (
        <Button
          onClick={onEdit}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Brief
        </Button>
      )}
    </div>
  );
};