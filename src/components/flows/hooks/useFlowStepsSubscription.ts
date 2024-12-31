import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

export const useFlowStepsSubscription = (flowId: string, queryClient: QueryClient) => {
  useEffect(() => {
    console.log('Setting up real-time subscription for flow steps:', flowId);
    
    const channel = supabase
      .channel(`flow_steps_${flowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_steps',
          filter: `flow_id=eq.${flowId}`
        },
        async (payload) => {
          console.log('Flow steps changed:', payload);
          // Invalidate queries to ensure UI is updated
          await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
          await queryClient.invalidateQueries({ queryKey: ["stages"] });
          await queryClient.invalidateQueries({ queryKey: ["flows"] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      void supabase.removeChannel(channel);
    };
  }, [flowId, queryClient]);
};