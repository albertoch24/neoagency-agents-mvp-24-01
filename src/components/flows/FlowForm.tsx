import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface FlowFormProps {
  onClose: () => void;
}

export const FlowForm = ({ onClose }: FlowFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a flow");
      return;
    }

    console.log("Creating flow with data:", { name, description, user_id: user.id });
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("flows")
        .insert([{ 
          name, 
          description,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating flow:", error);
        throw error;
      }

      console.log("Flow created successfully:", data);
      toast.success("Flow created successfully");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      onClose();
    } catch (error) {
      console.error("Error creating flow:", error);
      toast.error("Failed to create flow");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter flow name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter flow description"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Flow"}
        </Button>
      </div>
    </form>
  );
};