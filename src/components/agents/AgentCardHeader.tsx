import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Save, Pause, Play } from "lucide-react";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { VoiceSelector } from './VoiceSelector';

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
  const [isPausing, setIsPausing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(agent.voice_id || '21m00Tcm4TlvDq8ikWAM');
  const queryClient = useQueryClient();

  const handleSave = () => {
    onSave({
      name: editedName,
      description: editedDescription,
      voice_id: selectedVoice,
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedName(agent.name);
    setEditedDescription(agent.description || '');
    setSelectedVoice(agent.voice_id || '21m00Tcm4TlvDq8ikWAM');
    setIsEditing(true);
  };

  const handleVoiceChange = async (voiceId: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ 
          voice_id: voiceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      setSelectedVoice(voiceId);
      toast.success('Voice updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error updating voice:', error);
      toast.error('Failed to update voice');
    }
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
        </div>
      </div>
      {isEditing ? (
        <>
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="mt-2"
            placeholder="Enter agent description"
          />
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Voice</label>
            <VoiceSelector value={selectedVoice} onValueChange={handleVoiceChange} />
          </div>
        </>
      ) : (
        <CardDescription>{agent.description}</CardDescription>
      )}
    </CardHeader>
  );
};