import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowStageList } from "@/components/flows/WorkflowStageList";
import { BriefOutput } from "@/types/workflow";
import { useToast } from "@/components/ui/use-toast";

interface WorkflowConversationProps {
  briefId: string;
  currentStage: string;
}

export const WorkflowConversation = ({ briefId, currentStage }: WorkflowConversationProps) => {
  const { toast } = useToast();

  // Query to fetch conversations with no caching to ensure fresh data
  const { data: conversations, error: conversationsError } = useQuery({
    queryKey: ["workflow-conversations", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching conversations for stage:", currentStage);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("No active session");
      }
      
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
        console.error("Error fetching conversations:", conversationsError);
        throw conversationsError;
      }

      console.log("Found conversations:", conversationsData);
      return conversationsData;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
    retry: 3,
    onError: (error) => {
      console.error("Error in conversations query:", error);
      toast({
        title: "Error fetching conversations",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    },
  });

  // Query to fetch outputs
  const { data: outputs, error: outputsError } = useQuery({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", currentStage);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("No active session");
      }
      
      const { data: outputsData, error: outputsError } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", currentStage)
        .order("created_at", { ascending: false });

      if (outputsError) {
        console.error("Error fetching outputs:", outputsError);
        throw outputsError;
      }

      // Transform the outputs to match the expected format
      const transformedOutputs: BriefOutput[] = outputsData?.map((output) => ({
        ...output,
        content: typeof output.content === 'string' 
          ? { response: output.content }
          : typeof output.content === 'object' && output.content !== null
            ? output.content
            : { response: String(output.content) }
      })) || [];

      console.log("Found outputs:", transformedOutputs);
      return transformedOutputs;
    },
    enabled: !!briefId && !!currentStage,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
    onError: (error) => {
      console.error("Error in outputs query:", error);
      toast({
        title: "Error fetching outputs",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    },
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

  if (conversationsError || outputsError) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        There was an error loading the workflow data. Please try refreshing the page.
      </div>
    );
  }

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