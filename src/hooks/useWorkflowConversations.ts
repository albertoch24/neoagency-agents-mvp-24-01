import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWorkflowConversations = (briefId: string, currentStage: string) => {
  return useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      console.warn("🔍 Fetching conversations for:", {
        briefId,
        stage: currentStage,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from("workflow_conversations")
        .select(`
          *,
          agents (
            id,
            name,
            description,
            skills (*)
          ),
          flow_steps (
            id,
            order_index,
            description,
            requirements
          )
        `)
        .eq("brief_id", briefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Error loading conversations", {
          description: error.message
        });
        return [];
      }

      // IMPORTANT: Sorting monitor
      console.warn("🔍 Workflow Conversation Sorting Check:");
      console.warn("- Stage:", currentStage);
      console.warn("- Raw data count:", data?.length);
      
      const sortedData = data?.sort((a, b) => {
        const aIndex = a.flow_steps?.order_index ?? 0;
        const bIndex = b.flow_steps?.order_index ?? 0;
        console.warn(`Comparing steps: ${aIndex} vs ${bIndex}`);
        return aIndex - bIndex;
      });

      const sortingVerification = sortedData?.map(item => ({
        id: item.id,
        order_index: item.flow_steps?.order_index,
        agent: item.agents?.name
      }));
      
      console.warn("Sorted order verification:", sortingVerification);
      toast.info("Workflow sorting verification completed", {
        description: `${sortedData?.length || 0} conversations processed`
      });

      return sortedData || [];
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });
};