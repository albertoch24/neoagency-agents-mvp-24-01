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

      // Get the current highest order_index
      const { data: maxOrderStep, error: maxOrderError } = await supabase
        .from("flow_steps")
        .select("order_index")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      if (maxOrderError && maxOrderError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error("Error getting max order:", maxOrderError);
        toast.error("Failed to add step");
        return;
      }

      const nextOrderIndex = maxOrderStep ? maxOrderStep.order_index + 1 : 0;

      // Create the new step
      const { data: newStep, error: insertError } = await supabase
        .from("flow_steps")
        .insert([{
          flow_id: flow.id,
          agent_id: agentId,
          order_index: nextOrderIndex,
          outputs: [],
          requirements: "",
        }])
        .select(`
          *,
          agents (
            name,
            description
          )
        `)
        .single();

      if (insertError || !newStep) {
        console.error("Error adding step:", insertError);
        toast.error("Failed to add step");
        return;
      }

      // Transform and add the new step
      const transformedStep: FlowStep = {
        ...newStep,
        outputs: [],
      };

      setSteps(prevSteps => [...prevSteps, transformedStep]);
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      toast.success("Step added successfully");
    } catch (error) {
      console.error("Error in handleAddStep:", error);
      toast.error("Failed to add step");
    }
  };

  return {
    steps,
    handleAddStep,
    setSteps
  };
};