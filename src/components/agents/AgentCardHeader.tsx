import React, { useState } from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AgentActions } from './AgentActions';
import { AgentEditForm } from './AgentEditForm';

interface AgentCardHeaderProps {
  agent: Agent;
  onAddSkill: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (updatedAgent: Partial<Agent>) => void;
}

export const AgentCardHeader = ({
  agent,
  onAddSkill,
  onEdit,
  onDelete,
  onSave
}: AgentCardHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(agent.name);
  const [editedDescription, setEditedDescription] = useState(agent.description || '');
  const [editedPromptTemplate, setEditedPromptTemplate] = useState(agent.prompt_template || '');
  const [isPausing, setIsPausing] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: editedName,
          description: editedDescription,
          prompt_template: editedPromptTemplate,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      onSave({
        name: editedName,
        description: editedDescription,
        prompt_template: editedPromptTemplate,
      });
      setIsEditing(false);
      toast.success('Agent updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    }
  };

  const handleEdit = () => {
    setEditedName(agent.name);
    setEditedDescription(agent.description || '');
    setEditedPromptTemplate(agent.prompt_template || '');
    setIsEditing(true);
  };

  const handleTogglePause = async () => {
    try {
      setIsPausing(true);
      const { error } = await supabase
        .from('agents')
        .update({ 
          is_paused: !agent.is_paused,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast.success(agent.is_paused ? 'Agent activated' : 'Agent paused');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error toggling agent pause state:', error);
      toast.error('Failed to update agent status');
    } finally {
      setIsPausing(false);
    }
  };

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        {isEditing ? (
          <AgentEditForm
            name={editedName}
            description={editedDescription}
            promptTemplate={editedPromptTemplate}
            onNameChange={setEditedName}
            onDescriptionChange={setEditedDescription}
            onPromptTemplateChange={setEditedPromptTemplate}
          />
        ) : (
          <CardTitle>{agent.name}</CardTitle>
        )}
        <AgentActions
          isEditing={isEditing}
          isPaused={agent.is_paused || false}
          isPausing={isPausing}
          onAddSkill={onAddSkill}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={onDelete}
          onTogglePause={handleTogglePause}
        />
      </div>
    </CardHeader>
  );
};