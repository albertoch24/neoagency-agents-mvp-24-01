import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStagesData = (briefId: string | undefined) => {
  return useQuery({
    queryKey: ["stages", briefId],
    queryFn: async () => {
      console.log("Fetching stages for brief:", briefId);
      
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
              outputs
            )
          )
        `)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!briefId,
  });
};