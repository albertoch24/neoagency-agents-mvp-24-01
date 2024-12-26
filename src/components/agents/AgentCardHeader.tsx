import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Agent } from "@/types/agent";

interface AgentCardHeaderProps {
  agent: Agent;
  onAddSkill: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const AgentCardHeader: React.FC<AgentCardHeaderProps> = ({
  agent,
  onAddSkill,
  onEdit,
  onDelete
}) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>{agent.name}</CardTitle>
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
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Badge variant="secondary">{agent.skills.length} skills</Badge>
        </div>
      </div>
      <CardDescription>{agent.description}</CardDescription>
      {agent.skills.length > 0 && (
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