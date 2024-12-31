import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorkflowLogs = () => {
  return useQuery({
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
};