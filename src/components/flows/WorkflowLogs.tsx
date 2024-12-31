import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { WorkflowLogHeader } from "./WorkflowLogHeader";
import { WorkflowLogContent } from "./WorkflowLogContent";

export const WorkflowLogs = () => {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const { data: briefs, isLoading, error } = useQuery({
    queryKey: ["workflow-logs"],
    queryFn: async () => {
      console.log("Starting to fetch workflow logs");
      try {
        const { data: briefsData, error: briefsError } = await supabase
          .from("briefs")
          .select(`
            *,
            flows (
              id,
              name,
              description
            )
          `)
          .order("created_at", { ascending: false });

        if (briefsError) {
          console.error("Error fetching briefs:", briefsError);
          throw briefsError;
        }

        console.log("Fetched briefs:", briefsData);

        const briefsWithDetails = await Promise.all(
          briefsData.map(async (brief) => {
            try {
              console.log(`Fetching details for brief ${brief.id}`);

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

              const { data: outputs, error: outputsError } = await supabase
                .from("brief_outputs")
                .select("*")
                .eq("brief_id", brief.id)
                .order("created_at", { ascending: true });

              if (outputsError) {
                console.error(`Error fetching outputs for brief ${brief.id}:`, outputsError);
                return { ...brief, conversations, outputs: [] };
              }

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
    gcTime: 0,
    staleTime: 0,
  });

  const handleDeleteSelected = async () => {
    try {
      // First delete all workflow conversations for the selected briefs
      const { error: conversationsError } = await supabase
        .from("workflow_conversations")
        .delete()
        .in("brief_id", selectedLogs);

      if (conversationsError) throw conversationsError;

      // Then delete all brief outputs
      const { error: outputsError } = await supabase
        .from("brief_outputs")
        .delete()
        .in("brief_id", selectedLogs);

      if (outputsError) throw outputsError;

      // Finally delete the briefs
      const { error: briefsError } = await supabase
        .from("briefs")
        .delete()
        .in("id", selectedLogs);

      if (briefsError) throw briefsError;

      toast.success("Selected workflows deleted successfully");
      setSelectedLogs([]);
    } catch (error) {
      console.error("Error deleting workflows:", error);
      toast.error("Failed to delete workflows");
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
        <WorkflowLogHeader 
          selectedLogs={selectedLogs}
          onDeleteSelected={handleDeleteSelected}
        />
      </CardHeader>
      <CardContent>
        <WorkflowLogContent
          briefs={briefs}
          selectedLogs={selectedLogs}
          onToggleSelection={toggleLogSelection}
        />
      </CardContent>
    </Card>
  );
};