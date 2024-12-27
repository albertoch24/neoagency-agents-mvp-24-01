import { FlowStep } from "@/types/flow";

export const getDefaultSteps = (flowId: string): FlowStep[] => [
  {
    id: "00000000-0000-0000-0000-000000000001",
    flow_id: flowId,
    agent_id: "strategic-planner",
    order_index: 0,
    outputs: [
      { text: "Market Analysis Report" },
      { text: "Target Audience Insights" },
      { text: "Competitive Analysis" }
    ],
    requirements: "Analyze market trends and identify target audience segments",
    agents: {
      name: "Strategic Planner",
      description: "Expert in market analysis and strategic planning"
    }
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    flow_id: flowId,
    agent_id: "creative-director",
    order_index: 1,
    outputs: [
      { text: "Creative Brief" },
      { text: "Visual Direction" },
      { text: "Key Messages" }
    ],
    requirements: "Develop creative direction based on strategic insights",
    agents: {
      name: "Creative Director",
      description: "Leads creative vision and concept development"
    }
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    flow_id: flowId,
    agent_id: "content-strategist",
    order_index: 2,
    outputs: [
      { text: "Content Strategy" },
      { text: "Content Calendar" },
      { text: "Distribution Plan" }
    ],
    requirements: "Create content strategy aligned with creative direction",
    agents: {
      name: "Content Strategist",
      description: "Plans and oversees content creation and distribution"
    }
  }
];