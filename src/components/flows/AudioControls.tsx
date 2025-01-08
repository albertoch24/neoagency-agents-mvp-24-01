import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  url: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onAudioElement: (audio: HTMLAudioElement | null) => void;
}

export const AudioControls = ({ url, isPlaying, onPlayStateChange, onAudioElement }: AudioControlsProps) => {
  const handleClick = () => {
    onPlayStateChange(!isPlaying);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2",
        isPlaying && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      onClick={handleClick}
    >
      <Headphones className="h-4 w-4" />
      {isPlaying ? "Playing..." : "Play"}
    </Button>
  );
};