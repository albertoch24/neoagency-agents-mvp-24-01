import { Copy, History, Pencil } from "lucide-react";
import { Flow } from "@/types/flow";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface FlowListProps {
  flows?: Flow[];
  selectedFlow?: Flow | null;  // Added optional selectedFlow prop
  onSelect: (flow: Flow) => void;
  onShowHistory: (flow: Flow) => void;
}

export const FlowList = ({ 
  flows = [], 
  selectedFlow, 
  onSelect, 
  onShowHistory 
}: FlowListProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleCloneFlow = async (flow: Flow) => {
    if (!user) {
      toast.error("You must be logged in to clone a flow");
      return;
    }

    try {
      // First clone the flow
      const { data: newFlow, error: flowError } = await supabase
        .from("flows")
        .insert([{
          name: `${flow.name} (Copy)`,
          description: flow.description,
          user_id: user.id
        }])
        .select()
        .single();

      if (flowError) throw flowError;

      // Then get all steps from the original flow
      const { data: originalSteps, error: stepsError } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("flow_id", flow.id)
        .order("order_index");

      if (stepsError) throw stepsError;

      if (originalSteps && originalSteps.length > 0) {
        // Clone all steps for the new flow
        const newSteps = originalSteps.map(step => ({
          flow_id: newFlow.id,
          agent_id: step.agent_id,
          order_index: step.order_index,
          outputs: step.outputs,
          requirements: step.requirements
        }));

        const { error: newStepsError } = await supabase
          .from("flow_steps")
          .insert(newSteps);

        if (newStepsError) throw newStepsError;
      }

      toast.success("Flow cloned successfully");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    } catch (error) {
      console.error("Error cloning flow:", error);
      toast.error("Failed to clone flow");
    }
  };

  return (
    <div className="space-y-4">
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${
            selectedFlow?.id === flow.id ? 'bg-muted' : ''
          }`}
        >
          <div>
            <h3 className="font-medium">{flow.name}</h3>
            {flow.description && (
              <p className="text-sm text-muted-foreground">{flow.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCloneFlow(flow)}
              title="Clone flow"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSelect(flow)}
              title="Edit flow"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onShowHistory(flow)}
              title="View history"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {flows.length === 0 && (
        <p className="text-center text-muted-foreground">No flows found</p>
      )}
    </div>
  );
};