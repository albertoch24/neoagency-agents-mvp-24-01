import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Trash, Edit, User } from "lucide-react";
import { toast } from "sonner";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface FlowStep {
  id: string;
  flow_id: string;
  agent_id: string;
  order_index: number;
  outputs?: { text: string }[];
  requirements?: string;
}

interface FlowStepItemProps {
  step: FlowStep;
  agent?: Agent;
  index: number;
  isLast: boolean;
  flowId: string;
  onRemove: (stepId: string) => void;
}

export const FlowStepItem = ({ 
  step, 
  agent, 
  index, 
  isLast,
  flowId,
  onRemove 
}: FlowStepItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutputs, setEditedOutputs] = useState(
    step.outputs?.map(o => o.text).join('\n') || ''
  );
  const [editedRequirements, setEditedRequirements] = useState(step.requirements || '');
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const outputs = editedOutputs
        .split('\n')
        .filter(output => output.trim())
        .map(text => ({ text }));

      const { error } = await supabase
        .from("flow_steps")
        .update({
          outputs,
          requirements: editedRequirements,
        })
        .eq("id", step.id);

      if (error) throw error;

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
      toast.success("Step updated successfully");
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step");
    }
  };

  return (
    <div className="flex items-start gap-2">
      <AccordionItem value={step.id} className="w-full">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{agent?.name}</span>
            <span className="text-sm text-muted-foreground">
              (Step {index + 1})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {isEditing ? (
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm font-medium">
                  Required Outputs (one per line):
                </label>
                <Textarea
                  value={editedOutputs}
                  onChange={(e) => setEditedOutputs(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Requirements:
                </label>
                <Textarea
                  value={editedRequirements}
                  onChange={(e) => setEditedRequirements(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Required Outputs:
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {step.outputs?.map((output, i) => (
                    <li key={i} className="text-sm">
                      {output.text}
                    </li>
                  )) || <li>No outputs defined</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Requirements:
                </h4>
                <p className="text-sm">
                  {step.requirements || "No requirements defined"}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onRemove(step.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
      {!isLast && (
        <ArrowRight className="h-6 w-6 text-muted-foreground mt-4" />
      )}
    </div>
  );
};