import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flow, FlowStep } from "@/types/flow";
import { getDefaultSteps } from "./defaultSteps";

export const useFlowSteps = (flow: Flow) => {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const queryClient = useQueryClient();

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", flow.id],
    queryFn: async () => {
      if (flow.name === "Application Workflow") {
        return getDefaultSteps(flow.id);
      }

      const { data, error } = await supabase
        .from("flow_steps")
        .select(`
          *,
          agents (
            name,
            description
          )
        `)
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching flow steps:", error);
        toast.error("Failed to fetch flow steps");
        throw error;
      }
      
      return (data || []).map(step => ({
        ...step,
        outputs: step.outputs?.map((output: any) => ({
          text: typeof output === 'string' ? output : output.text
        })) || []
      })) as FlowStep[];
    },
  });

  useEffect(() => {
    if (flowSteps) {
      setSteps(flowSteps);
    }
  }, [flowSteps]);

  const handleSaveSteps = async () => {
    try {
      console.log('Saving current steps state:', steps);
      
      // First, delete all existing steps for this flow
      const { error: deleteError } = await supabase
        .from("flow_steps")
        .delete()
        .eq("flow_id", flow.id);

      if (deleteError) {
        console.error("Error deleting existing steps:", deleteError);
        toast.error("Failed to save steps");
        return;
      }

      // Then insert the current steps with their correct order
      if (steps.length > 0) {
        const { error: insertError } = await supabase
          .from("flow_steps")
          .insert(
            steps.map((step, index) => ({
              flow_id: flow.id,
              agent_id: step.agent_id,
              order_index: index,
              outputs: step.outputs || [],
              requirements: step.requirements || "",
            }))
          );

        if (insertError) {
          console.error("Error inserting steps:", insertError);
          toast.error("Failed to save steps");
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      toast.success("Steps saved successfully");
    } catch (error) {
      console.error("Error in handleSaveSteps:", error);
      toast.error("Failed to save steps");
    }
  };

  const handleAddStep = async (agentId: string) => {
    try {
      // First check if the agent exists and is not paused
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .eq("is_paused", false)
        .single();

      if (agentError || !agent) {
        console.error("Error checking agent:", agentError);
        toast.error("Failed to add step: Agent not found or is paused");
        return;
      }

      // Create the new step with the current number of steps as the order_index
      const newStep: FlowStep = {
        id: crypto.randomUUID(),
        flow_id: flow.id,
        agent_id: agentId,
        order_index: steps.length,
        outputs: [],
        requirements: "",
      };

      // Update local state first
      setSteps(prevSteps => [...prevSteps, newStep]);
      toast.success("Step added successfully");
    } catch (error) {
      console.error("Error in handleAddStep:", error);
      toast.error("Failed to add step");
    }
  };

  return {
    steps,
    handleAddStep,
    handleSaveSteps,
    setSteps
  };
};