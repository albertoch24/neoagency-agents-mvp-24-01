import { supabase } from "@/integrations/supabase/client";
import { BriefFormData } from "@/types/brief";

export const cleanupExistingBriefData = async (briefId: string) => {
  console.log("Cleaning up existing brief data:", briefId);
  
  const { error: deleteOutputsError } = await supabase
    .from("brief_outputs")
    .delete()
    .eq("brief_id", briefId);

  if (deleteOutputsError) {
    throw new Error("Failed to clean up existing brief outputs");
  }

  const { error: deleteConversationsError } = await supabase
    .from("workflow_conversations")
    .delete()
    .eq("brief_id", briefId);

  if (deleteConversationsError) {
    throw new Error("Failed to clean up existing conversations");
  }

  console.log("Successfully cleaned up existing brief data");
};

export const createOrUpdateBrief = async (
  values: BriefFormData,
  userId: string,
  existingBriefId?: string
) => {
  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .upsert({
      ...values,
      id: existingBriefId,
      user_id: userId,
      current_stage: "kickoff",
    })
    .select()
    .single();

  if (briefError) throw briefError;
  return brief;
};

export const fetchFirstStage = async (userId: string) => {
  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select(`
      id,
      name,
      flow_id,
      flows (
        id,
        name,
        flow_steps (
          id,
          agent_id,
          requirements,
          order_index,
          outputs
        )
      )
    `)
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (stageError) throw stageError;
  return stage;
};