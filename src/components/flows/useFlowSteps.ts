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
      console.log('Setting steps from flowSteps:', flowSteps);
      setSteps(flowSteps);
    }
  }, [flowSteps]);

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

      // Get the current steps from the database to ensure we have the latest state
      const { data: currentSteps, error: stepsError } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: true });

      if (stepsError) {
        console.error("Error fetching current steps:", stepsError);
        toast.error("Failed to add step");
        return;
      }

      const newStepIndex = currentSteps?.length || 0;
      console.log('Adding new step with index:', newStepIndex);

      const newStep = {
        flow_id: flow.id,
        agent_id: agentId,
        order_index: newStepIndex,
        outputs: [],
        requirements: "",
      };

      const { data, error } = await supabase
        .from("flow_steps")
        .insert([newStep])
        .select(`
          *,
          agents (
            name,
            description
          )
        `)
        .single();

      if (error) {
        console.error("Error adding step:", error);
        toast.error("Failed to add step");
        return;
      }

      // Transform the data to match FlowStep type
      const transformedStep: FlowStep = {
        ...data,
        outputs: [],
      };

      // Update local state with the current steps plus the new one
      setSteps(prevSteps => [...prevSteps, transformedStep]);
      
      // Also invalidate the query to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      
      toast.success("Step added successfully");
    } catch (error) {
      console.error("Error adding step:", error);
      toast.error("Failed to add step");
    }
  };

  return {
    steps,
    handleAddStep,
    setSteps
  };
};