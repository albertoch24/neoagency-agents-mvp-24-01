import React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const voices = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Calm and professional female voice"
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    description: "Confident and friendly male voice"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Warm and engaging female voice"
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "Warm and engaging male voice"
  },
  {
    id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Elli",
    description: "Gentle and soothing female voice"
  },
  {
    id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh",
    description: "Friendly and conversational male voice"
  },
  {
    id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    description: "Deep and authoritative male voice"
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Natural and professional male voice"
  },
  {
    id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam",
    description: "Serious and measured male voice"
  }
];

interface VoiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const VoiceSelector = ({ value, onValueChange }: VoiceSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedVoice = voices.find(voice => voice.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedVoice?.name || "Select voice..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandEmpty>No voice found.</CommandEmpty>
          <CommandGroup>
            {voices.map((voice) => (
              <CommandItem
                key={voice.id}
                value={voice.id}
                onSelect={() => {
                  onValueChange(voice.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === voice.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">{voice.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {voice.description}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};