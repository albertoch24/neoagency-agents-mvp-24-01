import { useState } from "react";
import { Stage } from "@/types/workflow";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/AuthProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StageFormProps {
  onClose: () => void;
  editingStage: Stage | null;
}

export const StageForm = ({ onClose, editingStage }: StageFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: editingStage?.name || "",
    description: editingStage?.description || "",
    flowId: editingStage?.flow_id || "",
  });

  // Fetch available flows for the user
  const { data: flows } = useQuery({
    queryKey: ["flows", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("flows")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.flowId) {
      toast.error("Please select a workflow");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStage) {
        // Update existing stage
        const { error } = await supabase
          .from("stages")
          .update({
            name: formData.name,
            description: formData.description,
            flow_id: formData.flowId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStage.id);

        if (error) throw error;
        
        toast.success("Stage updated successfully");
      } else {
        // Create new stage
        const { error } = await supabase.from("stages").insert({
          name: formData.name,
          description: formData.description,
          user_id: user.id,
          flow_id: formData.flowId,
          order_index: 0,
        });

        if (error) throw error;
        
        toast.success("Stage created successfully");
      }

      // Invalidate and refetch stages
      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      onClose();
    } catch (error) {
      console.error("Error saving stage:", error);
      toast.error("Failed to save stage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Stage Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Textarea
          placeholder="Stage Description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Select
          value={formData.flowId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, flowId: value }))
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a workflow" />
          </SelectTrigger>
          <SelectContent>
            {flows?.map((flow) => (
              <SelectItem key={flow.id} value={flow.id}>
                {flow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : editingStage ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};