import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStageList } from "../flows/WorkflowStageList";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
  showOutputs?: boolean;
}

export const WorkflowConversation = ({
  briefId,
  currentStage,
  showOutputs = false
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
            description,
            requirements
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
      return data || [];
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });

  const { data: briefOutputs } = useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", currentStage);
      try {
        const { data, error } = await supabase
          .from("brief_outputs")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage", currentStage)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching outputs:", error);
          throw error;
        }

        console.log("Found outputs:", data);
        return data?.map(output => ({
          stage: output.stage,
          content: transformContent(output.content),
          created_at: output.created_at
        }));
      } catch (error) {
        console.error("Error checking outputs:", error);
        return [];
      }
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000
  });

  // Helper function to transform content into the expected format
  const transformContent = (content: any) => {
    console.log("Transforming content:", content);
    
    if (typeof content === 'string') {
      try {
        return { response: JSON.parse(content) };
      } catch {
        return { response: content };
      }
    }
    
    if (typeof content === 'object' && content !== null) {
      if ('response' in content) {
        return content;
      }
      if ('outputs' in content) {
        return {
          ...content,
          response: content.outputs?.map((o: any) => o.content).join('\n')
        };
      }
      return { response: JSON.stringify(content) };
    }
    
    return { response: String(content) };
  };

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
    outputsCount: briefOutputs?.length,
    stages,
    showOutputs
  });

  return (
    <div className="space-y-8">
      <WorkflowStageList 
        stages={stages} 
        briefOutputs={briefOutputs || []}
        showOutputs={showOutputs}
      />
    </div>
  );
};