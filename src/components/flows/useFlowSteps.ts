import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flow, FlowStep } from "@/types/flow";
import { getDefaultSteps } from "./defaultSteps";

export const useFlowSteps = (flow: Flow) => {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", flow.id],
    queryFn: async () => {
      console.log('Fetching steps for flow:', flow.id);
      
      if (flow.name === "Application Workflow") {
        console.log('Getting default steps for Application Workflow');
        const defaultSteps = await getDefaultSteps(flow.id);
        console.log('Default steps:', defaultSteps);
        return defaultSteps;
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
      
      console.log('Fetched flow steps:', data);
      
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
      console.log('Setting steps:', flowSteps);
      setSteps(flowSteps);
    }
  }, [flowSteps]);

  const handleSaveSteps = async () => {
    try {
      setIsSaving(true);
      console.log('Saving current steps state:', steps);
      
      // Validate agent_ids are valid UUIDs
      const invalidSteps = steps.filter(step => !isValidUUID(step.agent_id));
      if (invalidSteps.length > 0) {
        console.error("Invalid agent IDs found:", invalidSteps);
        toast.error("Invalid agent IDs found in steps");
        return;
      }

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
              id: step.id,
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveStep = async (stepId: string) => {
    try {
      // Update local state first
      const updatedSteps = steps.filter(step => step.id !== stepId);
      setSteps(updatedSteps);
      toast.success("Step removed successfully");
    } catch (error) {
      console.error("Error in handleRemoveStep:", error);
      toast.error("Failed to remove step");
    }
  };

  const handleAddStep = async (agentId: string) => {
    try {
      if (!isValidUUID(agentId)) {
        console.error("Invalid agent ID:", agentId);
        toast.error("Invalid agent ID");
        return;
      }

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

      console.log('Adding step for agent:', agent);

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

  // Helper function to validate UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  return {
    steps,
    handleAddStep,
    handleSaveSteps,
    handleRemoveStep,
    setSteps,
    isSaving
  };
};