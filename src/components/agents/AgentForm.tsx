import { useState } from "react";
import { useForm } from "react-hook-form";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VoiceSelector } from "./VoiceSelector";

interface AgentFormProps {
  onSubmit: (data: Partial<Agent>) => Promise<void>;
  initialData?: Agent;
}

export const AgentForm = ({ onSubmit, initialData }: AgentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<Agent>>({
    defaultValues: initialData || {}
  });

  const onSubmitForm = async (data: Partial<Agent>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_template">Custom Prompt Template</Label>
        <Textarea
          id="prompt_template"
          {...register("prompt_template")}
          className="min-h-[200px]"
          placeholder="Enter a custom prompt template for this agent..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice">Voice</Label>
        <VoiceSelector
          value={initialData?.voice_id || ""}
          onValueChange={(voiceId) => register("voice_id").onChange({ target: { value: voiceId } })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : initialData ? "Update Agent" : "Create Agent"}
      </Button>
    </form>
  );
};