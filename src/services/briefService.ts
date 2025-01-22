import { supabase } from "@/integrations/supabase/client";
import { BriefFormData } from "@/types/brief";

export const createOrUpdateBrief = async (
  values: BriefFormData,
  userId: string,
  existingBriefId?: string
) => {
  const briefData = {
    user_id: userId,
    title: values.title,
    description: values.description,
    objectives: values.objectives,
    target_audience: values.target_audience,
    budget: values.budget,
    timeline: values.timeline,
    brand: values.brand,
    website: values.website,
    language: values.language || 'en'
  };

  try {
    if (existingBriefId) {
      const { data, error } = await supabase
        .from("briefs")
        .update(briefData)
        .eq("id", existingBriefId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("briefs")
        .insert(briefData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error in createOrUpdateBrief:", error);
    throw error;
  }
};

export const cleanupExistingBriefData = async (briefId: string) => {
  try {
    // Delete existing outputs
    const { error: outputsError } = await supabase
      .from("brief_outputs")
      .delete()
      .eq("brief_id", briefId);

    if (outputsError) {
      console.error("Error cleaning up outputs:", outputsError);
    }

    // Delete existing conversations
    const { error: conversationsError } = await supabase
      .from("workflow_conversations")
      .delete()
      .eq("brief_id", briefId);

    if (conversationsError) {
      console.error("Error cleaning up conversations:", conversationsError);
    }
  } catch (error) {
    console.error("Error in cleanupExistingBriefData:", error);
    throw error;
  }
};

export const fetchFirstStage = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("stages")
      .select(`
        *,
        flows (
          id,
          name,
          flow_steps (
            id,
            agent_id,
            requirements,
            order_index,
            outputs,
            agents (
              id,
              name,
              description
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in fetchFirstStage:", error);
    throw error;
  }
};