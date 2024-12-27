import { Button } from "@/components/ui/button";
import { ArrowLeft, ListChecks, Trash2 } from "lucide-react";
import { Flow } from "@/types/flow";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlowBuilderHeaderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilderHeader = ({ flow, onClose }: FlowBuilderHeaderProps) => {
  const queryClient = useQueryClient();

  const handleDeleteFlow = async () => {
    try {
      const { error: stepsError } = await supabase
        .from("flow_steps")
        .delete()
        .eq("flow_id", flow.id);

      if (stepsError) throw stepsError;

      const { error: flowError } = await supabase
        .from("flows")
        .delete()
        .eq("id", flow.id);

      if (flowError) throw flowError;

      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow deleted successfully");
      onClose();
    } catch (error) {
      console.error("Error deleting flow:", error);
      toast.error("Failed to delete flow");
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          <h2 className="text-2xl font-bold">{flow.name}</h2>
        </div>
      </div>
      <Button 
        variant="destructive" 
        onClick={handleDeleteFlow}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Flow
      </Button>
    </div>
  );
};