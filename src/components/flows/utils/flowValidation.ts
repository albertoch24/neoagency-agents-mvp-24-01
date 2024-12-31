import { supabase } from "@/integrations/supabase/client";

export const validateFlowOwnership = async (flowId: string, userId: string) => {
  console.log('Validating flow ownership:', { flowId, userId });
  
  const { data: flow, error } = await supabase
    .from('flows')
    .select('user_id')
    .eq('id', flowId)
    .maybeSingle();

  if (error) {
    console.error('Error verifying flow ownership:', error);
    throw error;
  }

  if (!flow) {
    console.error('Flow not found');
    throw new Error("Flow not found");
  }

  if (flow.user_id !== userId) {
    console.error('Flow does not belong to current user');
    throw new Error("Unauthorized");
  }

  return flow;
};