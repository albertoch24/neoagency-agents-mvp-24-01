import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStageList } from "./WorkflowStageList";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
}

export const WorkflowConversation = ({
  briefId,
  currentStage,
}: WorkflowConversationProps) => {
  const { data: conversations } = useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching conversations for stage:", currentStage);
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
            description
          )
        `)
        .eq("brief_id", briefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching conversations:", error);
        return [];
      }

      console.log("Found conversations:", data);
      return data;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });

  // Group conversations by stage
  const conversationsByStage = conversations?.reduce((acc: Record<string, any[]>, conv: any) => {
    if (!conv) return acc;
    
    const stageId = conv.stage_id;
    if (!acc[stageId]) {
      acc[stageId] = [];
    }
    acc[stageId].push(conv);
    return acc;
  }, {});

  const stages = Object.entries(conversationsByStage || {});

  console.log("Rendering WorkflowConversation with:", {
    briefId,
    currentStage,
    conversationsCount: conversations?.length,
    stages
  });

  return (
    <div className="space-y-8">
      <WorkflowStageList 
        stages={stages} 
      />
    </div>
  );
};