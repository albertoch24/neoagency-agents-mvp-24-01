import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoiceSelector } from './VoiceSelector';

interface AgentEditFormProps {
  name: string;
  description: string;
  selectedVoice: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onVoiceChange: (value: string) => void;
}

export const AgentEditForm = ({
  name,
  description,
  selectedVoice,
  onNameChange,
  onDescriptionChange,
  onVoiceChange
}: AgentEditFormProps) => {
  return (
    <>
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="font-semibold text-lg"
      />
      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="mt-2"
        placeholder="Enter agent description"
      />
      <div className="mt-4">
        <label className="text-sm font-medium mb-2 block">Voice</label>
        <VoiceSelector value={selectedVoice} onValueChange={onVoiceChange} />
      </div>
    </>
  );
};