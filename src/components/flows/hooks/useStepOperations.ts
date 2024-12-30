import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useStepOperations = (flowId: string) => {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const { user } = useAuth();

  const handleAddStep = async (agentId: string) => {
    if (!user) {
      console.error("No user found");
      toast.error("You must be logged in to add steps");
      return;
    }

    try {
      console.log('Adding step for flow:', flowId, 'agent:', agentId);
      
      // First verify the flow belongs to the user
      const { data: flow, error: flowError } = await supabase
        .from('flows')
        .select('user_id')
        .eq('id', flowId)
        .single();

      if (flowError || !flow) {
        console.error('Error verifying flow ownership:', flowError);
        toast.error("Failed to verify flow ownership");
        return;
      }

      if (flow.user_id !== user.id) {
        console.error('Flow does not belong to current user');
        toast.error("You don't have permission to modify this flow");
        return;
      }

      const newStep: FlowStep = {
        id: uuidv4(),
        flow_id: flowId,
        agent_id: agentId,
        order_index: steps.length,
      };

      setSteps((prevSteps) => [...prevSteps, newStep]);
      console.log('Step added successfully:', newStep);
    } catch (error) {
      console.error('Error adding step:', error);
      toast.error("Failed to add step");
    }
  };

  const handleRemoveStep = (stepId: string) => {
    console.log('Removing step:', stepId);
    setSteps((prevSteps) => prevSteps.filter((step) => step.id !== stepId));
  };

  return {
    steps,
    setSteps,
    handleAddStep,
    handleRemoveStep,
  };
};