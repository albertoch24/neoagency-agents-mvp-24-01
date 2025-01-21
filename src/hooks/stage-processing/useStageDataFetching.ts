import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveStageId } from "@/services/stage/resolveStageId";

export const useStageDataFetching = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchStageData = async (stageIdentifier: string) => {
    console.log("🔄 Fetching stage data for:", stageIdentifier);
    setIsLoading(true);

    try {
      const resolvedStageId = await resolveStageId(stageIdentifier);
      
      const { data: stage, error } = await supabase
        .from("stages")
        .select(`
          *,
          flows (
            id,
            name,
            flow_steps (*)
          )
        `)
        .eq("id", resolvedStageId)
        .single();

      if (error) {
        console.error("❌ Error fetching stage data:", error);
        toast.error("Failed to fetch stage data");
        throw error;
      }

      console.log("📋 Stage data:", {
        stageName: stage.name,
        hasFlow: !!stage.flows,
        flowStepsCount: stage.flows?.flow_steps?.length,
        timestamp: new Date().toISOString()
      });

      return stage;
    } catch (error) {
      console.error("❌ Stage data fetching failed:", error);
      toast.error("Failed to fetch stage data");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchStageData, isLoading };
};