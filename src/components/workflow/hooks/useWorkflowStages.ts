import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorkflowStages = (briefId: string | undefined) => {
  // Query to get stages data
  const { data: stages = [] } = useQuery({
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
              outputs,
              description
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

  // Query to get conversations data
  const { data: conversations = [] } = useQuery({
    queryKey: ["stage-conversations", briefId],
    queryFn: async () => {
      if (!briefId) return [];
      
      const { data, error } = await supabase
        .from("workflow_conversations")
        .select("*")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching stage conversations:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!briefId
  });

  // Transform stages and conversations into the required format [string, any[]][]
  const transformedStages = stages.map(stage => {
    const stageConversations = conversations.filter(conv => conv.stage_id === stage.id);
    return [stage.id, stageConversations] as [string, any[]];
  });

  return {
    stages: transformedStages,
    rawStages: stages,
  };
};