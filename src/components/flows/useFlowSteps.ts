import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flow, FlowStep } from "@/types/flow";
import { useStepOperations } from "./hooks/useStepOperations";
import { saveFlowSteps } from "./utils/stepUtils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Json } from "@/integrations/supabase/types";

export const useFlowSteps = (flow: Flow) => {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { steps, setSteps, handleAddStep, handleRemoveStep } = useStepOperations(flow.id);
  const { user } = useAuth();

  // Fetch flow steps
  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", flow.id],
    queryFn: async () => {
      console.log('Fetching steps for flow:', flow.id);
      
      if (!user) {
        console.error("No user found when fetching flow steps");
        throw new Error("Authentication required");
      }

      // First verify the flow belongs to the user
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select('user_id')
        .eq('id', flow.id)
        .single();

      if (flowError || !flowData) {
        console.error('Error verifying flow ownership:', flowError);
        throw flowError;
      }

      if (flowData.user_id !== user.id) {
        console.error('Flow does not belong to current user');
        throw new Error("Unauthorized");
      }

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
      const transformedSteps: FlowStep[] = (data || []).map(step => ({
        id: step.id,
        flow_id: step.flow_id,
        agent_id: step.agent_id,
        order_index: step.order_index,
        outputs: Array.isArray(step.outputs) 
          ? step.outputs.map((output: Json) => {
              if (typeof output === 'string') {
                return { text: output };
              }
              if (typeof output === 'object' && output !== null && 'text' in output) {
                return { text: (output as { text: string }).text || '' };
              }
              return { text: '' };
            })
          : [],
        requirements: step.requirements || "",
        agents: step.agents
      }));
      
      return transformedSteps;
    },
    enabled: !!user && !!flow.id,
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
      
      // Invalidate and refetch to ensure UI is in sync
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
      
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