import { useState } from "react";
import { useForm } from "react-hook-form";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <ScrollArea className="h-[80vh] pr-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
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
            placeholder="Describe what this agent specializes in..."
          />
        </div>

        <Card className="p-4 space-y-4 bg-agent border-agent-border">
          <div className="flex items-start space-x-2">
            <Label htmlFor="prompt_template" className="text-lg font-semibold">Custom Prompt Template</Label>
            <InfoIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>The prompt template defines how this agent will behave and respond. You can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Leave it empty to use the default template</li>
              <li>Customize it to give specific instructions to the agent</li>
              <li>Use variables like {`{name}`} and {`{description}`} that will be replaced with the agent's details</li>
            </ul>
          </div>

          <Textarea
            id="prompt_template"
            {...register("prompt_template")}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Enter a custom prompt template for this agent..."
          />
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : initialData ? "Update Agent" : "Create Agent"}
        </Button>
      </form>
    </ScrollArea>
  );
};