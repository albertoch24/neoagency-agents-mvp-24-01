import { FlowStep } from "@/types/flow";
import { supabase } from "@/integrations/supabase/client";

export const getDefaultSteps = async (flowId: string): Promise<FlowStep[]> => {
  console.log('Fetching agents for default steps...');
  
  // Fetch non-paused agents
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, description")
    .eq('is_paused', false)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching agents:", error);
    return [];
  }

  if (!agents || agents.length === 0) {
    console.error("No active agents found in the database");
    return [];
  }

  console.log('Found agents:', agents);

  // Map agents to steps, using as many agents as available
  return agents.map((agent, index) => {
    console.log(`Creating step ${index + 1} for agent:`, agent);
    
    return {
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
    };
  });
};