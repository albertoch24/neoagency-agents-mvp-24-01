import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FlowStepContent } from "./FlowStepContent";
import { AgentHeader } from "./AgentHeader";

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
  description?: string;
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
  const [editedDescription, setEditedDescription] = useState(step.description || '');
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      console.log('Starting save operation for step:', step.id);
      console.log('Flow ID:', flowId);
      
      const formattedOutputs = editedOutputs
        .split('\n')
        .filter(line => line.trim())
        .map(text => ({
          text: text.trim()
        }));

      console.log('Formatted outputs for saving:', formattedOutputs);

      const { error: updateError } = await supabase
        .from("flow_steps")
        .update({
          outputs: formattedOutputs,
          requirements: editedRequirements.trim(),
          description: editedDescription.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", step.id)
        .eq("flow_id", flowId);

      if (updateError) {
        console.error('Error updating step:', updateError);
        toast.error("Failed to save step");
        throw updateError;
      }

      console.log('Step updated successfully');
      
      setIsEditing(false);
      
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      await queryClient.invalidateQueries({ queryKey: ["flows"] });
      
      toast.success("Step updated successfully");
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("Failed to update step");
      await queryClient.invalidateQueries({ queryKey: ["flow-steps", flowId] });
    }
  };

  return (
    <div className="flex items-start gap-2">
      <AccordionItem value={step.id} className="w-full">
        <AccordionTrigger>
          <AgentHeader 
            agentName={agent?.name || 'Unknown Agent'} 
            index={index}
            orderIndex={step.order_index}
            outputs={step.outputs}
          />
        </AccordionTrigger>
        <AccordionContent>
          <FlowStepContent
            isEditing={isEditing}
            editedOutputs={editedOutputs}
            editedRequirements={editedRequirements}
            editedDescription={editedDescription}
            step={step}
            onEditOutputs={setEditedOutputs}
            onEditRequirements={setEditedRequirements}
            onEditDescription={setEditedDescription}
            onStartEdit={() => setIsEditing(true)}
            onCancelEdit={() => {
              setIsEditing(false);
              setEditedOutputs(step.outputs?.map(o => o.text).join('\n') || '');
              setEditedRequirements(step.requirements || '');
              setEditedDescription(step.description || '');
            }}
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