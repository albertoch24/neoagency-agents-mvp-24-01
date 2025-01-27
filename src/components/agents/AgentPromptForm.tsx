import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgentPromptFormProps {
  agentId: string;
  initialPrompt: string | null;
  onUpdate: () => void;
}

export const AgentPromptForm = ({ agentId, initialPrompt, onUpdate }: AgentPromptFormProps) => {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("agents")
        .update({ prompt_template: prompt })
        .eq("id", agentId);

      if (error) throw error;

      toast.success("Prompt template updated successfully");
      onUpdate();
    } catch (error) {
      console.error("Error updating prompt template:", error);
      toast.error("Failed to update prompt template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter custom prompt template..."
        className="min-h-[200px]"
      />
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Updating..." : "Update Prompt Template"}
      </Button>
    </div>
  );
};