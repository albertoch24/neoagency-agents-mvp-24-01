import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flow } from "@/types/flow";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";

interface FlowBuilderHeaderProps {
  flow: Flow;
  onClose: () => void;
  handleSaveSteps: () => void;
  isSaving: boolean;
}

export const FlowBuilderHeader = ({ flow, onClose, handleSaveSteps, isSaving }: FlowBuilderHeaderProps) => {
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

      // Then delete all flow history
      const { error: historyError } = await supabase
        .from("flow_history")
        .delete()
        .eq("flow_id", flow.id);

      if (historyError) {
        console.error("Error deleting flow history:", historyError);
        throw historyError;
      }

      // Update stages to remove reference to this flow instead of deleting them
      const { error: stagesError } = await supabase
        .from("stages")
        .update({ flow_id: null })
        .eq("flow_id", flow.id);

      if (stagesError) {
        console.error("Error updating stages:", stagesError);
        throw stagesError;
      }

      // Finally delete the flow itself
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
          onClick={handleSaveSteps}
          size="sm"
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
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteFlow}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Flow"}
        </Button>
      </div>
    </div>
  );
};