import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { resolveStageId } from "@/services/stage/resolveStageId";

export const useStageHandling = (stageId: string) => {
  return useQuery({
    queryKey: ["stage", stageId],
    queryFn: async () => {
      console.log('🔍 Fetching stage data:', {
        stageId,
        timestamp: new Date().toISOString()
      });

      try {
        // Resolve stage ID from name if necessary
        const resolvedStageId = await resolveStageId(stageId);
        
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
          .maybeSingle();

        if (error) {
          console.error("❌ Error fetching stage data:", {
            error,
            stageId,
            timestamp: new Date().toISOString()
          });
          throw error;
        }

        if (!stage) {
          console.error("❌ Stage not found:", {
            stageId,
            timestamp: new Date().toISOString()
          });
          throw new Error("Stage not found");
        }

        console.log("✅ Stage data retrieved:", {
          stageName: stage.name,
          hasFlow: !!stage.flows,
          flowStepsCount: stage.flows?.flow_steps?.length || 0,
          timestamp: new Date().toISOString()
        });

        return stage as Stage;
      } catch (error) {
        console.error("❌ Error fetching stage data:", {
          error,
          stageId,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: !!stageId
  });
};