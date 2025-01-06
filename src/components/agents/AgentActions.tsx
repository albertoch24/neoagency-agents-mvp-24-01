import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Save, Pause, Play, Loader2 } from "lucide-react";

interface AgentActionsProps {
  isEditing: boolean;
  isPaused: boolean;
  isPausing: boolean;
  onAddSkill: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onTogglePause: () => void;
}

export const AgentActions = ({
  isEditing,
  isPaused,
  isPausing,
  onAddSkill,
  onEdit,
  onSave,
  onDelete,
  onTogglePause
}: AgentActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onAddSkill}
        className="h-8 w-8"
        disabled={isPaused}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={isEditing ? onSave : onEdit}
        className="h-8 w-8"
      >
        {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-8 w-8"
        disabled={isPausing}
      >
        {isPaused ? (
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
  );
};