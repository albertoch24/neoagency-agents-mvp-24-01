import { Json } from "@/integrations/supabase/types";

export interface FlowStep {
  id: string;
  flow_id: string;
  agent_id: string;
  order_index: number;
  outputs?: { text: string }[];
  requirements?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  agents?: {
    name: string;
    description: string;
  };
}

export interface Flow {
  id: string;
  name: string;
  description: string | null;
}