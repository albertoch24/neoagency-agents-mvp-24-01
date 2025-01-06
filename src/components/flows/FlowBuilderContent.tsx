import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { FlowStepList } from "./FlowStepList";
import { FlowStep } from "@/types/flow";

interface FlowBuilderContentProps {
  steps: FlowStep[];
  agents: any[];
  flowId: string;
  onRemoveStep?: (stepId: string) => void;
}

export const FlowBuilderContent = ({ steps, agents, flowId, onRemoveStep }: FlowBuilderContentProps) => {
  return (
    <Card className="col-span-2 h-full">
      <CardContent className="p-6 h-full">
        <div className="flex items-center gap-2 mb-6">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Flow Steps</h3>
        </div>
        <div className="h-[calc(100vh-12rem)] overflow-y-auto pr-2">
          <FlowStepList 
            steps={steps} 
            agents={agents} 
            flowId={flowId} 
            onRemoveStep={onRemoveStep}
          />
        </div>
      </CardContent>
    </Card>
  );
};