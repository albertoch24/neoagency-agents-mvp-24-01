import React, { useState } from "react";  // Add explicit React import
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
      console.log("Fetching flows from database...");
      
      const { data, error } = await supabase
        .from("flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching flows:", error);
        throw error;
      }
      
      console.log("Flows fetched from database:", data);
      
      return data as Flow[];
    },
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0   // Don't cache the data
  });

  const { data: flowSteps } = useQuery({
    queryKey: ["flow-steps", selectedFlow?.id],
    queryFn: async () => {
      if (!selectedFlow?.id) return null;
      
      console.log("Fetching flow steps for flow:", selectedFlow.id);
      
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

      console.log("Flow steps fetched:", data);

      return (data || []).map(step => ({
        ...step,
        outputs: step.outputs?.map((output: any) => ({
          text: typeof output === 'string' ? output : output.text
        })) || []
      })) as FlowStep[];
    },
    enabled: !!selectedFlow?.id,
    staleTime: 0,  // Always fetch fresh data
    gcTime: 0   // Don't cache the data
  });

  // Reset selectedFlow if it's not in the flows list
  React.useEffect(() => {
    if (selectedFlow && flows && !flows.find(f => f.id === selectedFlow.id)) {
      console.log("Selected flow not found in database, resetting selection");
      setSelectedFlow(null);
    }
  }, [flows, selectedFlow]);

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