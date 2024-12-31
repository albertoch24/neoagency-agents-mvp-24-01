import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, User } from "lucide-react";
import { toast } from "sonner";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FlowStepContent } from "./FlowStepContent";

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
      console.log('Starting save operation for step:', step.id);
      
      // Format outputs array from the textarea content with specific structure
      const outputs = editedOutputs
        .split('\n')
        .filter(line => line.trim()) // Remove empty lines
        .map(text => ({
          text: text.trim(),
          type: 'required_output', // Adding type for better AI interpretation
          format: 'text', // Specifying format for AI processing
          context: editedRequirements.trim() // Including requirements as context
        }));

      console.log('Formatted outputs for saving:', outputs);

      // First verify the flow exists
      const { error: flowError } = await supabase
        .from("flows")
        .select("id")
        .eq("id", flowId)
        .single();

      if (flowError) {
        console.error('Error verifying flow:', flowError);
        toast.error("Failed to verify flow");
        return;
      }

      // Update the step with the formatted data
      const { error: updateError } = await supabase
        .from("flow_steps")
        .update({
          outputs,
          requirements: editedRequirements.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", step.id)
        .eq("flow_id", flowId);

      if (updateError) {
        console.error('Error updating step:', updateError);
        toast.error("Failed to save step");
        throw updateError;
      }

      console.log('Step updated successfully');
      
      // Update local state
      setIsEditing(false);
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      
      toast.success("Step updated successfully");
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("Failed to update step");
      
      // Refetch to ensure UI shows current server state
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
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
          <FlowStepContent
            isEditing={isEditing}
            editedOutputs={editedOutputs}
            editedRequirements={editedRequirements}
            step={step}
            onEditOutputs={setEditedOutputs}
            onEditRequirements={setEditedRequirements}
            onStartEdit={() => setIsEditing(true)}
            onCancelEdit={() => setIsEditing(false)}
            onSave={handleSave}
            onRemove={onRemove}
            stepId={step.id}
          />
        </AccordionContent>
      </AccordionItem>
      {!isLast && (
        <ArrowRight className="h-6 w-6 text-muted-foreground mt-4" />
      )}
    </div>
  );
};