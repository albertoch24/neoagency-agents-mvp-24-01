import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";

export const saveFlowSteps = async (flowId: string, steps: FlowStep[]) => {
  console.log('Starting saveFlowSteps operation for flow:', flowId);
  console.log('Steps to save:', steps);

  // First, delete all existing steps for this flow
  const { error: deleteError } = await supabase
    .from("flow_steps")
    .delete()
    .eq("flow_id", flowId);

  if (deleteError) {
    console.error("Error deleting existing steps:", deleteError);
    throw deleteError;
  }

  // Then insert the current steps with their correct order
  if (steps.length > 0) {
    const stepsToInsert = steps.map((step, index) => ({
      id: step.id,
      flow_id: flowId,
      agent_id: step.agent_id,
      order_index: index,
      outputs: step.outputs || [],
      requirements: step.requirements || "",
    }));

    console.log('Inserting steps:', stepsToInsert);

    const { error: insertError } = await supabase
      .from("flow_steps")
      .insert(stepsToInsert);

    if (insertError) {
      console.error("Error inserting steps:", insertError);
      throw insertError;
    }
  }

  console.log('Steps saved successfully');
};