import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoiceSelector } from './VoiceSelector';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InfoIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentEditFormProps {
  name: string;
  description: string;
  selectedVoice: string;
  promptTemplate: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onVoiceChange: (value: string) => void;
  onPromptTemplateChange: (value: string) => void;
}

export const AgentEditForm = ({
  name,
  description,
  selectedVoice,
  promptTemplate,
  onNameChange,
  onDescriptionChange,
  onVoiceChange,
  onPromptTemplateChange
}: AgentEditFormProps) => {
  return (
    <ScrollArea className="h-[80vh] pr-4">
      <div className="space-y-6">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="font-semibold text-lg"
          placeholder="Agent name"
        />
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="mt-2"
          placeholder="Enter agent description"
        />

        <Card className="p-4 space-y-4 bg-agent border-agent-border">
          <div className="flex items-start space-x-2">
            <Label htmlFor="prompt_template" className="text-lg font-semibold">Custom Prompt Template</Label>
            <InfoIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>The prompt template defines how this agent will behave and respond. You can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Leave it empty to use the default template</li>
              <li>Customize it to give specific instructions to the agent</li>
              <li>Use variables like {`{name}`} and {`{description}`} that will be replaced with the agent's details</li>
            </ul>
          </div>

          <Textarea
            value={promptTemplate}
            onChange={(e) => onPromptTemplateChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Enter a custom prompt template for this agent..."
          />
        </Card>

        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Voice</Label>
          <VoiceSelector value={selectedVoice} onValueChange={onVoiceChange} />
        </div>
      </div>
    </ScrollArea>
  );
};