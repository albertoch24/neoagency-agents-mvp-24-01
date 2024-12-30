import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, History, Trash2 } from "lucide-react";
import { WorkflowLogItem } from "./WorkflowLogItem";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

export const WorkflowLogs = () => {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const { data: briefs, isLoading, error } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
      console.log("Starting to fetch workflow logs");
      try {
        // First, get all briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from("briefs")
          .select("*")
          .order("created_at", { ascending: false });

        if (briefsError) {
          console.error("Error fetching briefs:", briefsError);
          throw briefsError;
        }

        console.log("Fetched briefs:", briefsData);

        // For each brief, get its conversations and outputs with detailed information
        const briefsWithDetails = await Promise.all(
          briefsData.map(async (brief) => {
            try {
              console.log(`Fetching details for brief ${brief.id}`);

              // Get conversations with agent and skills details
              const { data: conversations, error: convsError } = await supabase
                .from("workflow_conversations")
                .select(`
                  *,
                  agents!workflow_conversations_agent_id_fkey (
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
                .eq("brief_id", brief.id)
                .order("created_at", { ascending: true });

              if (convsError) {
                console.error(`Error fetching conversations for brief ${brief.id}:`, convsError);
                return { ...brief, conversations: [], outputs: [] };
              }

              console.log(`Fetched conversations for brief ${brief.id}:`, conversations);

              // Get brief outputs with stage information
              const { data: outputs, error: outputsError } = await supabase
                .from("brief_outputs")
                .select("*")
                .eq("brief_id", brief.id)
                .order("created_at", { ascending: true });

              if (outputsError) {
                console.error(`Error fetching outputs for brief ${brief.id}:`, outputsError);
                return { ...brief, conversations, outputs: [] };
              }

              console.log(`Fetched outputs for brief ${brief.id}:`, outputs);

              // Group conversations by stage
              const stageMap = conversations.reduce((acc: any, conv: any) => {
                if (!acc[conv.stage_id]) {
                  acc[conv.stage_id] = {
                    stage: conv.stage_id,
                    conversations: [],
                    agents: new Set(),
                    outputs: outputs.filter((o: any) => o.stage === conv.stage_id)
                  };
                }
                acc[conv.stage_id].conversations.push(conv);
                if (conv.agents) {
                  acc[conv.stage_id].agents.add(conv.agents.name);
                }
                return acc;
              }, {});

              // Convert stage map to array and format agents sets to arrays
              const stages = Object.values(stageMap).map((stage: any) => ({
                ...stage,
                agents: Array.from(stage.agents)
              }));

              return {
                ...brief,
                stages,
                conversations,
                outputs
              };
            } catch (error) {
              console.error(`Error processing brief ${brief.id}:`, error);
              return { ...brief, stages: [], conversations: [], outputs: [] };
            }
          })
        );

        console.log("Final briefs with details:", briefsWithDetails);
        return briefsWithDetails;
      } catch (error) {
        console.error("Error in workflow logs query:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from("briefs")
        .delete()
        .in("id", selectedLogs);

      if (error) throw error;

      toast.success("Selected logs deleted successfully");
      setSelectedLogs([]);
    } catch (error) {
      console.error("Error deleting logs:", error);
      toast.error("Failed to delete logs");
    }
  };

  const toggleLogSelection = (briefId: string) => {
    setSelectedLogs(prev => 
      prev.includes(briefId)
        ? prev.filter(id => id !== briefId)
        : [...prev, briefId]
    );
  };

  if (error) {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-destructive text-center mb-4">
            Failed to load workflow logs. Please try again later.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workflow Activity Log
          </CardTitle>
          {selectedLogs.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedLogs.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {briefs && briefs.length > 0 ? (
          <div className="space-y-8">
            {briefs.map((brief: any) => (
              <div key={brief.id} className="flex items-start gap-2">
                <Checkbox
                  checked={selectedLogs.includes(brief.id)}
                  onCheckedChange={() => toggleLogSelection(brief.id)}
                  className="mt-2"
                />
                <div className="flex-1">
                  <WorkflowLogItem brief={brief} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No workflow logs available
          </p>
        )}
      </CardContent>
    </Card>
  );
};