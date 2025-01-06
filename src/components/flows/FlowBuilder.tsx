import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flow } from "@/types/flow";
import { useFlowSteps } from "./hooks/useFlowSteps";
import { useQuery } from "@tanstack/react-query";
import { FlowBuilderHeader } from "./FlowBuilderHeader";
import { FlowBuilderSidebar } from "./FlowBuilderSidebar";
import { FlowBuilderContent } from "./FlowBuilderContent";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFlowStepsSubscription } from "./hooks/useFlowStepsSubscription";

interface FlowBuilderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilder = ({ flow, onClose }: FlowBuilderProps) => {
  const { steps, handleAddStep, handleSaveSteps, handleRemoveStep, isSaving } = useFlowSteps(flow);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Set up real-time subscription
  useFlowStepsSubscription(flow.id, queryClient);

  const { data: agents, error: agentsError } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      console.log('Fetching agents for user:', user?.id);
      
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_paused", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching agents:", error);
        toast.error("Failed to load agents");
        throw error;
      }

      console.log('Fetched agents:', data);
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  if (agentsError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading agents. Please try again later.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[80vh]">
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
          <FlowBuilderHeader flow={flow} onClose={onClose} />
          <Button 
            onClick={handleSaveSteps}
            className="gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Steps"}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FlowBuilderSidebar 
            agents={agents || []} 
            onAddAgent={handleAddStep} 
          />
          <FlowBuilderContent 
            steps={steps} 
            agents={agents || []} 
            flowId={flow.id}
            onRemoveStep={handleRemoveStep}
          />
        </div>
      </div>
    </ScrollArea>
  );
};