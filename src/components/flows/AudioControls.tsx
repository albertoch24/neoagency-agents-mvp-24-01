import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
}

export const AudioControls = ({ isPlaying, onPlay }: AudioControlsProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2",
        isPlaying && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      onClick={onPlay}
    >
      <Headphones className="h-4 w-4" />
      {isPlaying ? "Playing..." : "Play"}
    </Button>
  );
};