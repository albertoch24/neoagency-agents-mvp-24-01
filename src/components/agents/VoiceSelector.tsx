import React, { useState, useEffect } from 'react';
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Voice {
  id: string;
  name: string;
  description: string;
  available?: boolean;
}

const defaultVoices: Voice[] = [
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
  }
];

interface VoiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function VoiceSelector({ value, onValueChange }: VoiceSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVoiceAvailability = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('secrets')
          .select('secret')
          .eq('name', 'ELEVEN_LABS_API_KEY')
          .maybeSingle();

        if (error) {
          console.error('Error fetching API key:', error);
          toast.error('Failed to fetch ElevenLabs API key');
          setVoices(defaultVoices.map(voice => ({ ...voice, available: false })));
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.error('ElevenLabs API key not found');
          toast.error('ElevenLabs API key not found. Please add it in settings.');
          setVoices(defaultVoices.map(voice => ({ ...voice, available: false })));
          setIsLoading(false);
          return;
        }

        const apiKey = data.secret;
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }

        const responseData = await response.json();
        const availableVoiceIds = new Set(responseData.voices.map((v: any) => v.voice_id));
        
        const updatedVoices = defaultVoices.map(voice => ({
          ...voice,
          available: availableVoiceIds.has(voice.id)
        }));

        setVoices(updatedVoices);
      } catch (error) {
        console.error('Error checking voice availability:', error);
        toast.error('Failed to check voice availability');
        setVoices(defaultVoices.map(voice => ({ ...voice, available: false })));
      } finally {
        setIsLoading(false);
      }
    };

    checkVoiceAvailability();
  }, []);

  const selectedVoice = voices.find(voice => voice.id === value);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        Loading voices...
      </Button>
    );
  }

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
                onSelect={() => {
                  if (!voice.available) {
                    toast.error(`Voice ${voice.name} is not available`);
                    return;
                  }
                  onValueChange(voice.id);
                  setOpen(false);
                }}
                disabled={!voice.available}
                className={cn(
                  "flex items-center",
                  !voice.available && "opacity-50 cursor-not-allowed"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === voice.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">
                    {voice.name}
                    {!voice.available && " (Not Available)"}
                  </div>
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
}