import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";

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

  const handleRemoveStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from("flow_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;

      // Update order_index for remaining steps
      const updatedSteps = steps
        .filter((s) => s.id !== stepId)
        .map((s, index) => ({ ...s, order_index: index }));

      for (const step of updatedSteps) {
        await supabase
          .from("flow_steps")
          .update({ order_index: step.order_index })
          .eq("id", step.id);
      }

      queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      toast.success("Step removed successfully");
    } catch (error) {
      console.error("Error removing step:", error);
      toast.error("Failed to remove step");
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
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {agents?.map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddStep(agent.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {agent.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Flow Steps</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const agent = agents?.find((a) => a.id === step.agent_id);
                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <Card className="flex-1">
                        <CardContent className="p-4 flex justify-between items-center">
                          <span>{agent?.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
                {steps.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    Add agents from the left panel to create your flow
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};