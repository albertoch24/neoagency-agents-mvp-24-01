import { useState } from "react";
import { FlowStep } from "@/types/flow";
import { validateAgent } from "../utils/stepUtils";

export const useStepOperations = (flowId: string) => {
  const [steps, setSteps] = useState<FlowStep[]>([]);

  const handleAddStep = async (agentId: string) => {
    try {
      const agent = await validateAgent(agentId);
      console.log('Adding step for agent:', agent);

      const newStep: FlowStep = {
        id: crypto.randomUUID(),
        flow_id: flowId,
        agent_id: agentId,
        order_index: steps.length,
        outputs: [],
        requirements: "",
      };

      const updatedSteps = [...steps, newStep];
      setSteps(updatedSteps);
      
      return updatedSteps;
    } catch (error) {
      console.error("Error in handleAddStep:", error);
      throw error;
    }
  };

  const handleRemoveStep = (stepId: string) => {
    const updatedSteps = steps.filter(step => step.id !== stepId);
    setSteps(updatedSteps);
    return updatedSteps;
  };

  return {
    steps,
    setSteps,
    handleAddStep,
    handleRemoveStep,
  };
};