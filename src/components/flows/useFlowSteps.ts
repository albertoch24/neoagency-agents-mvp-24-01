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

      // Fetch the latest state of steps
      const { data: latestSteps, error: fetchError } = await supabase
        .from("flow_steps")
        .select("order_index")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching latest steps:", fetchError);
        toast.error("Failed to add step");
        return;
      }

      // Calculate the new order index
      const nextOrderIndex = latestSteps && latestSteps.length > 0 
        ? latestSteps[0].order_index + 1 
        : 0;

      // Create the new step
      const { data: newStepData, error: insertError } = await supabase
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

      if (insertError || !newStepData) {
        console.error("Error adding step:", insertError);
        toast.error("Failed to add step");
        return;
      }

      // Transform the new step data
      const transformedStep: FlowStep = {
        ...newStepData,
        outputs: [],
      };

      // Update local state
      setSteps(prevSteps => [...prevSteps, transformedStep]);
      
      // Invalidate the query to ensure consistency
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