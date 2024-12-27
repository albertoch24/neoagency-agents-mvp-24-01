import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";

export const getDefaultSteps = async (flowId: string): Promise<FlowStep[]> => {
  // Fetch the first 3 available agents
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, description")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!agents || agents.length === 0) {
    console.error("No agents found in the database");
    return [];
  }

  // Map agents to steps, using as many agents as available
  return agents.map((agent, index) => ({
    id: crypto.randomUUID(),
    flow_id: flowId,
    agent_id: agent.id,
    order_index: index,
    outputs: index === 0 
      ? [
          { text: "Market Analysis Report" },
          { text: "Target Audience Insights" },
          { text: "Competitive Analysis" }
        ]
      : index === 1
      ? [
          { text: "Creative Brief" },
          { text: "Visual Direction" },
          { text: "Key Messages" }
        ]
      : [
          { text: "Content Strategy" },
          { text: "Content Calendar" },
          { text: "Distribution Plan" }
        ],
    requirements: index === 0
      ? "Analyze market trends and identify target audience segments"
      : index === 1
      ? "Develop creative direction based on strategic insights"
      : "Create content strategy aligned with creative direction",
    agents: {
      name: agent.name,
      description: agent.description
    }
  }));
};