import { Button } from "@/components/ui/button";
import { ArrowLeft, ListChecks, Trash2, Edit2 } from "lucide-react";
import { Flow } from "@/types/flow";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FlowBuilderHeaderProps {
  flow: Flow;
  onClose: () => void;
}

export const FlowBuilderHeader = ({ flow, onClose }: FlowBuilderHeaderProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(flow.name);
  const [description, setDescription] = useState(flow.description || "");

  // Update local state when flow prop changes
  useEffect(() => {
    if (flow) {
      setName(flow.name);
      setDescription(flow.description || "");
    }
  }, [flow]);

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

  const handleSaveEdit = async () => {
    try {
      console.log("Saving flow with description:", description);
      
      const { error } = await supabase
        .from("flows")
        .update({ 
          name, 
          description: description || null, // Ensure null is sent when empty
          updated_at: new Date().toISOString()
        })
        .eq("id", flow.id);

      if (error) {
        console.error("Error updating flow:", error);
        throw error;
      }

      // Invalidate and refetch to ensure UI is updated
      await queryClient.invalidateQueries({ queryKey: ["flows"] });
      
      toast.success("Flow updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating flow:", error);
      toast.error("Failed to update flow");
    }
  };

  const handleCancel = () => {
    // Reset form to original values on cancel
    setName(flow.name);
    setDescription(flow.description || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-sm"
                placeholder="Flow name"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="max-w-sm"
                placeholder="Flow description"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit}>Save</Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              <div>
                <h2 className="text-2xl font-bold">{flow.name}</h2>
                {flow.description && (
                  <p className="text-sm text-muted-foreground">{flow.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="ml-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
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
    </div>
  );
};