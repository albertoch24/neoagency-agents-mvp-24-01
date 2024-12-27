import { Accordion } from "@/components/ui/accordion";
import { FlowStepItem } from "./FlowStepItem";
import { Flow, FlowStep } from "@/types/flow";

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface FlowStepListProps {
  steps: FlowStep[];
  agents?: Agent[];
  flowId: string;
  onRemoveStep?: (stepId: string) => void;
}

export const FlowStepList = ({ steps, agents, flowId, onRemoveStep }: FlowStepListProps) => {
  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {steps.map((step, index) => {
          const agent = agents?.find((a) => a.id === step.agent_id);
          return (
            <FlowStepItem
              key={step.id}
              step={step}
              agent={agent}
              index={index}
              isLast={index === steps.length - 1}
              flowId={flowId}
              onRemove={onRemoveStep}
            />
          );
        })}
      </Accordion>
      {steps.length === 0 && (
        <p className="text-center text-muted-foreground">
          Add agents from the left panel to create your flow
        </p>
      )}
    </div>
  );
};