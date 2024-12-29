import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Save, Pause, Play, X } from "lucide-react";
import { Agent, Skill } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AgentCardHeaderProps {
  agent: Agent;
  onAddSkill: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (updatedAgent: Partial<Agent>) => void;
}

export const AgentCardHeader: React.FC<AgentCardHeaderProps> = ({
  agent,
  onAddSkill,
  onEdit,
  onDelete,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(agent.name);
  const [editedDescription, setEditedDescription] = useState(agent.description || '');
  const [isPausing, setIsPausing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const queryClient = useQueryClient();

  const handleSave = () => {
    onSave({
      name: editedName,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedName(agent.name);
    setEditedDescription(agent.description || '');
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

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast.success('Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  };

  const handleEditSkill = async (skill: Skill) => {
    if (editingSkill?.id === skill.id) {
      try {
        const { error } = await supabase
          .from('skills')
          .update({
            name: editingSkill.name,
            description: editingSkill.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', skill.id);

        if (error) throw error;

        toast.success('Skill updated successfully');
        setEditingSkill(null);
        queryClient.invalidateQueries({ queryKey: ['agents'] });
      } catch (error) {
        console.error('Error updating skill:', error);
        toast.error('Failed to update skill');
      }
    } else {
      setEditingSkill(skill);
    }
  };

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="font-semibold text-lg"
          />
        ) : (
          <CardTitle>{agent.name}</CardTitle>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddSkill}
            className="h-8 w-8"
            disabled={agent.is_paused}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isEditing ? handleSave : handleEdit}
            className="h-8 w-8"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePause}
            className="h-8 w-8"
            disabled={isPausing}
          >
            {agent.is_paused ? (
              <Play className="h-4 w-4 text-green-500" />
            ) : (
              <Pause className="h-4 w-4 text-yellow-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className={agent.is_paused ? "opacity-50" : ""}>
            {agent.skills?.length || 0} skills
          </Badge>
        </div>
      </div>
      {isEditing ? (
        <Textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          className="mt-2"
          placeholder="Enter agent description"
        />
      ) : (
        <CardDescription>{agent.description}</CardDescription>
      )}
      {agent.skills && agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {agent.skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-1">
              {editingSkill?.id === skill.id ? (
                <Input
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className="h-6 w-32 text-sm"
                />
              ) : (
                <Badge variant="outline" className="pr-1">
                  {skill.name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditSkill(skill)}
                className="h-4 w-4 p-0"
              >
                {editingSkill?.id === skill.id ? (
                  <Save className="h-3 w-3" />
                ) : (
                  <Edit2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteSkill(skill.id)}
                className="h-4 w-4 p-0 text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {agent.is_paused && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mt-2">
          Paused
        </Badge>
      )}
    </CardHeader>
  );
};