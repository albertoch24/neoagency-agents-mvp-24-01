import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AgentList } from "./AgentList";
import { FlowStepList } from "./FlowStepList";

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{flow.name}</h2>
        <Button onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Available Agents</h3>
            <AgentList agents={agents} onAddAgent={handleAddStep} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Flow Steps</h3>
            <FlowStepList steps={steps} agents={agents} flowId={flow.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};