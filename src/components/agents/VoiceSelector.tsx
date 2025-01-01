import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

const voices = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel (Default)",
    description: "Professional female voice"
  },
  {
    id: "9BWtsMINqrJLrRacOk9x",
    name: "Aria",
    description: "Professional female voice"
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    name: "Roger",
    description: "Authoritative male voice"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Friendly female voice"
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie",
    description: "Young male voice"
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel",
    description: "Calm male voice"
  }
];

interface VoiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function VoiceSelector({ value, onValueChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedVoice = voices.find((voice) => voice.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedVoice?.name ?? "Select voice..."}
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
                onSelect={(currentValue) => {
                  onValueChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === voice.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{voice.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {voice.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}