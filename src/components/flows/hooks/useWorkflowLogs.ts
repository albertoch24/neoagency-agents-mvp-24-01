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
            flow:flows!briefs_flow_id_fkey (
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

        console.log("Fetched briefs with flows:", briefsData);

        const briefsWithDetails = await Promise.all(
          briefsData.map(async (brief) => {
            try {
              console.log(`Fetching details for brief ${brief.id}, flow_id: ${brief.flow_id}`);

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
                  ),
                  flow_steps!workflow_conversations_flow_step_id_fkey (
                    id,
                    order_index,
                    requirements,
                    description
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
                if (!conv) return acc;
                
                const stepId = conv.flow_step_id || `no-step-${conv.id}`;
                if (!acc[stepId]) {
                  acc[stepId] = {
                    agent: conv.agents || { id: conv.agent_id, name: 'Unknown Agent' },
                    conversations: [],
                    summary: null,
                    orderIndex: conv.flow_steps?.order_index || 0,
                    briefId: conv.brief_id,
                    stageId: conv.stage_id,
                    flowStep: conv.flow_steps
                  };
                }
                
                if (conv.output_type === 'summary') {
                  acc[stepId].summary = conv;
                } else {
                  acc[stepId].conversations.push(conv);
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