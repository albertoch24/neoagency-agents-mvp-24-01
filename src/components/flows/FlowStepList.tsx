import { Accordion } from "@/components/ui/accordion";
import { FlowStepItem } from "./FlowStepItem";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
}

export const FlowStepList = ({ steps, agents, flowId }: FlowStepListProps) => {
  const queryClient = useQueryClient();

  const handleRemoveStep = async (stepId: string) => {
    try {
      console.log('Removing step:', stepId);
      
      // Delete the specific step
      const { error: deleteError } = await supabase
        .from("flow_steps")
        .delete()
        .eq("id", stepId);

      if (deleteError) {
        console.error("Error deleting step:", deleteError);
        toast.error("Failed to delete step");
        return;
      }

      // Get remaining steps after deletion
      const remainingSteps = steps.filter(step => step.id !== stepId);
      
      // Update order_index for remaining steps
      for (let i = 0; i < remainingSteps.length; i++) {
        const { error: updateError } = await supabase
          .from("flow_steps")
          .update({ order_index: i })
          .eq("id", remainingSteps[i].id);
        
        if (updateError) {
          console.error("Error updating step order:", updateError);
          toast.error("Failed to update step order");
          return;
        }
      }

      // Invalidate and refetch to ensure UI is in sync with database
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
      toast.success("Step removed successfully");
    } catch (error) {
      console.error("Error removing step:", error);
      toast.error("Failed to remove step");
    }
  };

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
              onRemove={handleRemoveStep}
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