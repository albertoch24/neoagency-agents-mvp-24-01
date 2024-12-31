export interface BriefFormData {
  title: string;
  description: string;
  objectives: string;
  target_audience: string;
  budget: string;
  timeline: string;
}

export interface Stage {
  id: string;
  name: string;
  flow_id: string;
  flows?: {
    id: string;
    name: string;
    flow_steps: Array<{
      id: string;
      agent_id: string;
      requirements: string;
      order_index: number;
      outputs: any[];
    }>;
  };
}