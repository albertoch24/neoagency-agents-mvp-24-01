import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStageList } from "@/components/flows/WorkflowStageList";
import { BriefOutput } from "@/types/workflow";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
}

export const WorkflowConversation = ({ briefId, currentStage }: WorkflowConversationProps) => {
  // Query to fetch conversations with no caching to ensure fresh data
  const { data: conversations } = useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching conversations for stage:", currentStage);
      
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("workflow_conversations")
        .select(`
          *,
          agents:agent_id (
            id,
            name,
            description,
            skills (
              id,
              name,
              type,
              description
            )
          )
        `)
        .eq("brief_id", briefId)
        .eq("stage_id", currentStage)
        .order("created_at", { ascending: true });

      if (conversationsError) {
        console.log("Error fetching conversations:", conversationsError);
        return [];
      }

      console.log("Found conversations:", conversationsData);
      return conversationsData;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  // Query to fetch outputs
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", currentStage);
      
      const { data: outputsData, error: outputsError } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", currentStage)
        .order("created_at", { ascending: false });

      if (outputsError) {
        console.log("Error fetching outputs:", outputsError);
        return [];
      }

      // Transform the outputs to match the expected format
      const transformedOutputs = outputsData?.map((output) => ({
        ...output,
        content: typeof output.content === 'string' 
          ? { response: output.content }
          : output.content
      })) || [];

      console.log("Found outputs:", transformedOutputs);
      return transformedOutputs;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
  });

  // Group conversations by stage
  const groupedConversations = conversations?.reduce((acc: Record<string, any[]>, conv: any) => {
    if (!acc[conv.stage_id]) {
      acc[conv.stage_id] = [];
    }
    acc[conv.stage_id].push(conv);
    return acc;
  }, {});

  // Convert to array of tuples [stageId, conversations[]]
  const stages = groupedConversations ? Object.entries(groupedConversations) : [];

  if (!conversations?.length && !outputs?.length) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Stage Progress</h3>
      <WorkflowStageList 
        stages={stages} 
        briefOutputs={outputs || []} 
      />
    </div>
  );
};