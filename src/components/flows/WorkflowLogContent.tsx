import { WorkflowLogItem } from "./WorkflowLogItem";
import { Checkbox } from "@/components/ui/checkbox";

interface WorkflowLogContentProps {
  briefs: any[];
  selectedLogs: string[];
  onToggleSelection: (briefId: string) => void;
}

export const WorkflowLogContent = ({ 
  briefs, 
  selectedLogs, 
  onToggleSelection 
}: WorkflowLogContentProps) => {
  if (!briefs?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No workflow logs available
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {briefs.map((brief: any) => (
        <div key={brief.id} className="flex items-start gap-2">
          <Checkbox
            checked={selectedLogs.includes(brief.id)}
            onCheckedChange={() => onToggleSelection(brief.id)}
            className="mt-2"
          />
          <div className="flex-1">
            <WorkflowLogItem brief={brief} />
          </div>
        </div>
      ))}
    </div>
  );
};