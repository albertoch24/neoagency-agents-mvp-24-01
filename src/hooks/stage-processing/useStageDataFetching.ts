import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const useStageDataFetching = () => {
  const fetchStageData = async (stageId: string) => {
    console.log("🔍 Fetching stage data and flow steps:", {
      stageId,
      timestamp: new Date().toISOString()
    });

    const { data: stage, error: stageError } = await supabase
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
            description
          )
        )
      `)
      .eq("id", stageId)
      .single();

    if (stageError) {
      console.error("❌ Error fetching stage:", {
        error: stageError,
        stageId,
        timestamp: new Date().toISOString()
      });
      throw new Error("Failed to fetch stage data");
    }

    return stage as Stage;
  };

  return { fetchStageData };
};