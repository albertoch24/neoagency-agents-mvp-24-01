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

  // Then insert the new steps
  if (steps.length > 0) {
    const { error: insertError } = await supabase
      .from("flow_steps")
      .insert(
        steps.map((step, index) => ({
          flow_id: flowId,
          agent_id: step.agent_id,
          order_index: index,
          outputs: step.outputs || [],
          requirements: step.requirements || ""
        }))
      );

    if (insertError) {
      console.error("Error inserting new steps:", insertError);
      throw insertError;
    }
  }

  console.log('Steps saved successfully');
};