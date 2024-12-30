import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";

export const getDefaultSteps = async (flowId: string): Promise<FlowStep[]> => {
  console.log('No default steps will be added');
  return [];
};