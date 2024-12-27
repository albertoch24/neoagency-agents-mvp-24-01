import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { FlowStepList } from "./FlowStepList";
import { FlowStep } from "@/types/flow";

interface FlowBuilderContentProps {
  steps: FlowStep[];
  agents: any[];
  flowId: string;
}

export const FlowBuilderContent = ({ steps, agents, flowId }: FlowBuilderContentProps) => {
  return (
    <Card className="col-span-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-4 w-4" />
          <h3 className="font-semibold">Flow Steps</h3>
        </div>
        <FlowStepList steps={steps} agents={agents} flowId={flowId} />
      </CardContent>
    </Card>
  );
};