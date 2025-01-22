import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const useStageDataFetching = () => {
  const fetchStageData = async (stageId: string) => {
    console.log("🔍 Fetching stage data:", {
      stageId,
      timestamp: new Date().toISOString()
    });

    const { data: stage, error: stageError } = await supabase
      .from("stages")
      .select(`
        *,
        flow_id
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

    console.log("✅ Stage data retrieved:", {
      stageName: stage.name,
      flowId: stage.flow_id,
      timestamp: new Date().toISOString()
    });

    return stage as Stage;
  };

  return { fetchStageData };
};