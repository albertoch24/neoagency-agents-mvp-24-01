import { supabase } from "@/integrations/supabase/client";
import { FlowStep } from "@/types/flow";
import { toast } from "sonner";

export const saveFlowSteps = async (flowId: string, steps: FlowStep[]) => {
  console.log('Starting saveFlowSteps operation for flow:', flowId);
  console.log('Steps to save:', steps);

  try {
    // First verify the flow exists
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("id")
      .eq("id", flowId)
      .maybeSingle();

    if (flowError) {
      console.error('Error verifying flow:', flowError);
      throw new Error("Failed to verify flow");
    }

    if (!flow) {
      console.error('Flow not found:', flowId);
      throw new Error("Flow not found");
    }

    // Get existing flow steps
    const { data: existingSteps, error: getError } = await supabase
      .from("flow_steps")
      .select("id")
      .eq("flow_id", flowId);

    if (getError) {
      console.error("Error getting existing steps:", getError);
      throw getError;
    }

    // Delete associated workflow conversations first
    if (existingSteps && existingSteps.length > 0) {
      const stepIds = existingSteps.map(step => step.id);
      const { error: deleteConvsError } = await supabase
        .from("workflow_conversations")
        .delete()
        .in("flow_step_id", stepIds);

      if (deleteConvsError) {
        console.error("Error deleting workflow conversations:", deleteConvsError);
        throw deleteConvsError;
      }
    }

    // Then delete existing steps
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
            requirements: step.requirements || "",
            description: step.description || ""
          }))
        );

      if (insertError) {
        console.error("Error inserting new steps:", insertError);
        throw insertError;
      }
    }

    console.log('Steps saved successfully');
  } catch (error) {
    console.error('Error in saveFlowSteps:', error);
    throw error;
  }
};