import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface DatabaseBriefOutput {
  id: string;
  brief_id: string;
  stage: string;
  content: Json;
  created_at: string;
  updated_at: string;
  stage_id: string | null;
  output_type: string;
}

export const useBriefOutputs = (briefId: string | undefined, stageId: string | undefined) => {
  return useQuery<DatabaseBriefOutput[]>({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching brief outputs for:", { briefId, stageId });
      
      if (!briefId || !stageId) {
        console.log("Missing briefId or stageId:", { briefId, stageId });
        return [];
      }

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching brief outputs:", error);
        return [];
      }

      console.log("Found brief outputs:", {
        count: data?.length,
        outputs: data?.map(output => ({
          id: output.id,
          type: output.output_type,
          hasContent: !!output.content,
          contentType: typeof output.content,
          stage: output.stage,
          stageId: output.stage_id
        }))
      });
      
      return data;
    },
    enabled: !!briefId && !!stageId
  });
};