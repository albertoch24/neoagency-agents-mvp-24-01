import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flow } from "@/types/flow";
import { useFlowSteps } from "./useFlowSteps";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { FlowBuilderHeader } from "./FlowBuilderHeader";
import { FlowBuilderSidebar } from "./FlowBuilderSidebar";
import { FlowBuilderContent } from "./FlowBuilderContent";

interface FlowBuilderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilder = ({ flow, onClose }: FlowBuilderProps) => {
  const { steps, handleAddStep } = useFlowSteps(flow);
  const queryClient = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Subscribe to real-time changes on flow_steps
  useEffect(() => {
    console.log('Setting up real-time subscription for flow steps');
    
    const channel = supabase
      .channel('flow_steps_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_steps',
          filter: `flow_id=eq.${flow.id}`
        },
        async (payload) => {
          console.log('Flow steps changed:', payload);
          // Refetch the steps when changes occur
          await queryClient.invalidateQueries({ queryKey: ["flow-steps", flow.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [flow.id, queryClient]);

  return (
    <div className="space-y-4">
      <FlowBuilderHeader flow={flow} onClose={onClose} />
      <div className="grid grid-cols-3 gap-4">
        <FlowBuilderSidebar 
          agents={agents || []} 
          onAddAgent={handleAddStep} 
        />
        <FlowBuilderContent 
          steps={steps} 
          agents={agents || []} 
          flowId={flow.id} 
        />
      </div>
    </div>
  );
};