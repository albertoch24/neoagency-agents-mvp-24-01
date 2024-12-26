import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Plus, Save, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editedOutputs, setEditedOutputs] = useState<string>("");
  const [editedRequirements, setEditedRequirements] = useState<string>("");
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

  const handleRemoveStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from("flow_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;

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

  const handleEditStep = (step: FlowStep) => {
    setEditingStepId(step.id);
    setEditedOutputs(step.outputs?.join('\n') || '');
    setEditedRequirements(step.requirements || '');
  };

  const handleSaveStep = async (stepId: string) => {
    try {
      const outputs = editedOutputs.split('\n').filter(output => output.trim());
      const { error } = await supabase
        .from("flow_steps")
        .update({
          outputs,
          requirements: editedRequirements,
        })
        .eq("id", stepId);

      if (error) throw error;

      setEditingStepId(null);
      queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      toast.success("Step updated successfully");
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step");
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
            <ScrollArea className="h-[600px]">
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
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const agent = agents?.find((a) => a.id === step.agent_id);
                  return (
                    <div key={step.id} className="flex items-start gap-2">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={step.id}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{agent?.name}</span>
                              <span className="text-sm text-muted-foreground">
                                (Step {index + 1})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {editingStepId === step.id ? (
                              <div className="space-y-4 p-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    Required Outputs (one per line):
                                  </label>
                                  <Textarea
                                    value={editedOutputs}
                                    onChange={(e) => setEditedOutputs(e.target.value)}
                                    className="mt-1"
                                    rows={4}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Requirements:
                                  </label>
                                  <Textarea
                                    value={editedRequirements}
                                    onChange={(e) => setEditedRequirements(e.target.value)}
                                    className="mt-1"
                                    rows={4}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingStepId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleSaveStep(step.id)}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 p-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">
                                    Required Outputs:
                                  </h4>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {step.outputs?.map((output, i) => (
                                      <li key={i} className="text-sm">
                                        {output}
                                      </li>
                                    )) || <li>No outputs defined</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">
                                    Requirements:
                                  </h4>
                                  <p className="text-sm">
                                    {step.requirements || "No requirements defined"}
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleEditStep(step)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleRemoveStep(step.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-muted-foreground mt-4" />
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