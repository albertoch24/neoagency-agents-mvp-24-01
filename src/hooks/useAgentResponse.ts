import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAgentResponse = () => {
  const { toast } = useToast();

  const getAgentResponse = async (agentId: string, input: string) => {
    const operationId = crypto.randomUUID();
    
    try {
      console.log('🚀 Agent Response API Call - Start:', {
        operationId,
        timestamp: new Date().toISOString(),
        agentId,
        inputLength: input.length
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ Agent Response API Call - No Session:', {
          operationId,
          timestamp: new Date().toISOString()
        });
        throw new Error('No active session');
      }

      console.log('📝 Agent Response API Call - Pre-Request:', {
        operationId,
        timestamp: new Date().toISOString(),
        hasSession: !!session,
        hasAgentId: !!agentId
      });

      const { data, error } = await supabase.functions.invoke('agent-response', {
        body: { agentId, input }
      });

      if (error) {
        console.error('💥 Agent Response API Call - Error:', {
          operationId,
          timestamp: new Date().toISOString(),
          error: error.message,
          details: error
        });
        throw error;
      }

      console.log('✅ Agent Response API Call - Success:', {
        operationId,
        timestamp: new Date().toISOString(),
        hasResponse: !!data?.response,
        responseLength: data?.response?.length
      });

      return data.response;
    } catch (error) {
      console.error('❌ Agent Response API Call - Exception:', {
        operationId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
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