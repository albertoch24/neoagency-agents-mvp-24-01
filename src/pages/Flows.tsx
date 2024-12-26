import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Flow, FlowStep } from "@/types/flow";
import { useAuth } from "@/components/auth/AuthProvider";
import { WorkflowLogs } from "@/components/flows/WorkflowLogs";
import { FlowsHeader } from "@/components/flows/FlowsHeader";
import { FlowsContent } from "@/components/flows/FlowsContent";
import { FlowDialogs } from "@/components/flows/FlowDialogs";

const Flows = () => {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  // Fetch user profile to check if admin
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: flows, isLoading } = useQuery({
    queryKey: ["flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Flow[];
    },
  });

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", selectedFlow?.id],
    queryFn: async () => {
      if (!selectedFlow?.id) return null;
      
      const { data, error } = await supabase
        .from("flow_steps")
        .select(`
          *,
          agents (
            name,
            description
          )
        `)
        .eq("flow_id", selectedFlow.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return (data || []).map(step => ({
        ...step,
        outputs: step.outputs?.map((output: any) => ({
          text: typeof output === 'string' ? output : output.text
        })) || []
      })) as FlowStep[];
    },
    enabled: !!selectedFlow?.id,
  });

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const applicationFlow = flows?.find(flow => flow.name === "Application Workflow");

  return (
    <div className="container py-8">
      <FlowsHeader
        applicationFlow={applicationFlow}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
      />

      <FlowsContent
        flows={flows}
        selectedFlow={selectedFlow}
        setSelectedFlow={setSelectedFlow}
        flowSteps={flowSteps}
        applicationFlow={applicationFlow}
        setShowHistory={setShowHistory}
      />

      {/* Only show workflow logs for admin users */}
      {profile?.is_admin && <WorkflowLogs />}

      <FlowDialogs
        selectedFlow={selectedFlow}
        showHistory={showHistory}
        setSelectedFlow={setSelectedFlow}
        setShowHistory={setShowHistory}
      />
    </div>
  );
};

export default Flows;