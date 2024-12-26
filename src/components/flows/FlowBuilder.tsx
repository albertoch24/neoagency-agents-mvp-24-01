import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AgentList } from "./AgentList";
import { FlowStepList } from "./FlowStepList";
import { ArrowLeft, Trash2, ListChecks } from "lucide-react";

interface Flow {
  id: string;
  name: string;
  description: string | null;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface FlowStep {
  id: string;
  flow_id: string;
  agent_id: string;
  order_index: number;
  outputs?: string[];
  requirements?: string;
}

interface FlowBuilderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilder = ({ flow, onClose }: FlowBuilderProps) => {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const queryClient = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", flow.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as FlowStep[];
    },
  });

  useEffect(() => {
    if (flowSteps) {
      setSteps(flowSteps);
    }
  }, [flowSteps]);

  const handleAddStep = async (agentId: string) => {
    try {
      const newStep = {
        flow_id: flow.id,
        agent_id: agentId,
        order_index: steps.length,
        outputs: [],
        requirements: "",
      };

      const { error } = await supabase
        .from("flow_steps")
        .insert([newStep]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      toast.success("Step added successfully");
    } catch (error) {
      console.error("Error adding step:", error);
      toast.error("Failed to add step");
    }
  };

  const handleDeleteFlow = async () => {
    try {
      // First delete all flow steps
      const { error: stepsError } = await supabase
        .from("flow_steps")
        .delete()
        .eq("flow_id", flow.id);

      if (stepsError) throw stepsError;

      // Then delete the flow itself
      const { error: flowError } = await supabase
        .from("flows")
        .delete()
        .eq("id", flow.id);

      if (flowError) throw flowError;

      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow deleted successfully");
      onClose();
    } catch (error) {
      console.error("Error deleting flow:", error);
      toast.error("Failed to delete flow");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            <h2 className="text-2xl font-bold">{flow.name}</h2>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleDeleteFlow}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Flow
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4" />
              <h3 className="font-semibold">Available Agents</h3>
            </div>
            <AgentList agents={agents} onAddAgent={handleAddStep} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4" />
              <h3 className="font-semibold">Flow Steps</h3>
            </div>
            <FlowStepList steps={steps} agents={agents} flowId={flow.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};