import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2 } from "lucide-react";

interface WorkflowLogHeaderProps {
  selectedLogs: string[];
  onDeleteSelected: () => void;
}

export const WorkflowLogHeader = ({ selectedLogs, onDeleteSelected }: WorkflowLogHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <CardTitle className="flex items-center gap-2">
        <History className="h-5 w-5" />
        Workflow Activity Log
      </CardTitle>
      {selectedLogs.length > 0 && (
        <Button 
          variant="destructive" 
          onClick={onDeleteSelected}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected ({selectedLogs.length})
        </Button>
      )}
    </div>
  );
};