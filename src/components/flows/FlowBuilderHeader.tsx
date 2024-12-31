import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flow } from "@/types/flow";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface FlowBuilderHeaderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilderHeader = ({ flow, onClose }: FlowBuilderHeaderProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleDeleteFlow = async () => {
    try {
      setIsDeleting(true);
      console.log("Starting flow deletion process for flow:", flow.id);

      // First delete all flow steps
      const { error: flowStepsError } = await supabase
        .from("flow_steps")
        .delete()
        .eq("flow_id", flow.id);

      if (flowStepsError) {
        console.error("Error deleting flow steps:", flowStepsError);
        throw flowStepsError;
      }

      // Then delete all stages associated with this flow
      const { error: stagesError } = await supabase
        .from("stages")
        .delete()
        .eq("flow_id", flow.id);

      if (stagesError) {
        console.error("Error deleting stages:", stagesError);
        throw stagesError;
      }

      // Finally delete the flow
      const { error: flowError } = await supabase
        .from("flows")
        .delete()
        .eq("id", flow.id);

      if (flowError) {
        console.error("Error deleting flow:", flowError);
        throw flowError;
      }

      toast.success("Flow deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      navigate("/flows");
    } catch (error) {
      console.error("Error deleting flow:", error);
      toast.error("Failed to delete flow");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold">{flow.name}</h2>
        {flow.description && (
          <p className="text-muted-foreground">{flow.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          variant="destructive"
          onClick={handleDeleteFlow}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Flow"}
        </Button>
      </div>
    </div>
  );
};