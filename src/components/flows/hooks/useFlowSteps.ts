import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flow, FlowStep } from "@/types/flow";
import { useStepOperations } from "./useStepOperations";
import { saveFlowSteps } from "../utils/stepUtils";
import { validateFlowOwnership } from "../utils/flowValidation";
import { useAuth } from "@/components/auth/AuthProvider";

export const useFlowSteps = (flow: Flow) => {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { steps, setSteps, handleAddStep, handleRemoveStep } = useStepOperations(flow.id);
  const { user } = useAuth();

  // Fetch flow steps with no caching
  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", flow.id],
    queryFn: async () => {
      console.log('Fetching steps for flow:', flow.id);
      
      if (!user) {
        console.error("No user found when fetching flow steps");
        throw new Error("Authentication required");
      }

      // Verify flow ownership
      await validateFlowOwnership(flow.id, user.id);

      const { data, error } = await supabase
        .from("flow_steps")
        .select("*, agents(name, description)")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching flow steps:", error);
        throw error;
      }
      
      console.log('Fetched flow steps:', data);
      
      // Transform the data to match FlowStep type
      return data?.map(step => ({
        id: step.id,
        flow_id: step.flow_id,
        agent_id: step.agent_id,
        order_index: step.order_index,
        outputs: step.outputs || [],
        requirements: step.requirements || "",
        agents: step.agents
      })) || [];
    },
    enabled: !!user && !!flow.id,
    staleTime: 0,
    gcTime: 0
  });

  // Update steps when flowSteps changes
  useEffect(() => {
    if (flowSteps) {
      console.log('Setting steps:', flowSteps);
      setSteps(flowSteps);
    }
  }, [flowSteps, setSteps]);

  const handleSaveSteps = async () => {
    if (!user) {
      toast.error("You must be logged in to save steps");
      return;
    }

    try {
      setIsSaving(true);
      console.log('Saving current steps state:', steps);
      
      await saveFlowSteps(flow.id, steps);
      
      // Invalidate and refetch queries to ensure UI is in sync
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      await queryClient.invalidateQueries({ queryKey: ["flows"] });
      
      toast.success("Steps saved successfully");
    } catch (error) {
      console.error("Error in handleSaveSteps:", error);
      toast.error("Failed to save steps");
      // Refetch to ensure UI shows current server state
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    steps,
    handleAddStep,
    handleSaveSteps,
    handleRemoveStep,
    isSaving,
  };
};