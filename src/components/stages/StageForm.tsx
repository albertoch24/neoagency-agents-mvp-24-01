import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  user_id: string;
}

interface StageFormProps {
  onClose: () => void;
  editingStage?: Stage | null;
}

export const StageForm = ({ onClose, editingStage }: StageFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editingStage) {
      setName(editingStage.name);
      setDescription(editingStage.description || "");
    }
  }, [editingStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingStage) {
        // Update existing stage
        const { error } = await supabase
          .from("stages")
          .update({
            name,
            description,
          })
          .eq("id", editingStage.id);

        if (error) throw error;

        toast.success("Stage updated successfully");
      } else {
        // Get the current highest order_index
        const { data: stages } = await supabase
          .from("stages")
          .select("order_index")
          .order("order_index", { ascending: false })
          .limit(1);

        const nextOrderIndex = stages && stages.length > 0 ? stages[0].order_index + 1 : 0;

        // Create new stage
        const { error } = await supabase.from("stages").insert({
          name,
          description,
          user_id: user.id,
          order_index: nextOrderIndex,
        });

        if (error) throw error;

        toast.success("Stage created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["stages"] });
      onClose();
    } catch (error) {
      console.error("Error saving stage:", error);
      toast.error(editingStage ? "Failed to update stage" : "Failed to create stage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{editingStage ? "Edit Stage" : "Create New Stage"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Input
            placeholder="Stage Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Textarea
            placeholder="Stage Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editingStage ? "Update Stage" : "Create Stage"}
        </Button>
      </div>
    </form>
  );
};