import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Save } from "lucide-react";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Badge variant="secondary">{agent.skills?.length || 0} skills</Badge>
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
            <Badge key={skill.id} variant="outline">
              {skill.name}
            </Badge>
          ))}
        </div>
      )}
    </CardHeader>
  );
};