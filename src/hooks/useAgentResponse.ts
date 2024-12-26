import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAgentResponse = () => {
  const { toast } = useToast();

  const getAgentResponse = async (agentId: string, input: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('agent-response', {
        body: { agentId, input }
      });

      if (error) throw error;

      return data.response;
    } catch (error) {
      console.error('Error getting agent response:', error);
      toast({
        title: "Error",
        description: "Failed to get agent response. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  return { getAgentResponse };
};