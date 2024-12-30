import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";

export const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const saveFlowSteps = async (flowId: string, steps: FlowStep[]) => {
  console.log('Saving steps for flow:', flowId, steps);
  
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
    const { error: insertError } = await supabase
      .from("flow_steps")
      .insert(
        steps.map((step, index) => ({
          id: step.id,
          flow_id: flowId,
          agent_id: step.agent_id,
          order_index: index,
          outputs: step.outputs || [],
          requirements: step.requirements || "",
        }))
      );

    if (insertError) {
      console.error("Error inserting steps:", insertError);
      throw insertError;
    }
  }
};

export const validateAgent = async (agentId: string) => {
  if (!isValidUUID(agentId)) {
    throw new Error("Invalid agent ID");
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("is_paused", false)
    .single();

  if (agentError || !agent) {
    throw new Error("Agent not found or is paused");
  }

  return agent;
};