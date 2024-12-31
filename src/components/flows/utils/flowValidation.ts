import { supabase } from "@/integrations/supabase/client";

export const validateFlowOwnership = async (flowId: string, userId: string) => {
  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("user_id")
    .eq("id", flowId)
    .maybeSingle();

  if (flowError) {
    console.error('Error verifying flow ownership:', flowError);
    throw new Error("Failed to verify flow ownership");
  }

  if (!flow) {
    console.error('Flow not found:', flowId);
    throw new Error("Flow not found");
  }

  if (flow.user_id !== userId) {
    console.error('Flow does not belong to current user');
    throw new Error("Unauthorized");
  }

  return flow;
};