import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      
      // Format outputs as an array of objects with text property
      const formattedOutputs = editedOutputs
        .split('\n')
        .filter(line => line.trim())
        .map(text => ({
          text: text.trim()
        }));

      console.log('Formatted outputs for saving:', formattedOutputs);

      // Ensure all fields are properly formatted before saving
      const updateData = {
        outputs: formattedOutputs || [], // Default to empty array if undefined
        requirements: editedRequirements?.trim() || '', // Default to empty string if undefined
        description: editedDescription?.trim() || '', // Default to empty string if undefined
        updated_at: new Date().toISOString()
      };

      console.log('Update data:', updateData);

      const { data, error: updateError } = await supabase
        .from("flow_steps")
        .update(updateData)
        .eq("id", step.id)
        .eq("flow_id", flowId)
        .select();

      if (updateError) {
        console.error('Error updating step:', updateError);
        toast.error("Failed to save step");
        throw updateError;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after update');
        toast.error("Failed to save step - no data returned");
        return;
      }

      console.log('Step updated successfully:', data);
      
      setIsEditing(false);
      
      // Invalidate and refetch queries to update UI
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
  );
};