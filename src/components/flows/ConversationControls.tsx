import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface ConversationControlsProps {
  content: string;
  isPlaying?: boolean;
  visibleText?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onAudioElement?: (audio: HTMLAudioElement | null) => void;
  onToggleText?: () => void;
}

export const ConversationControls = ({ 
  content,
  isPlaying,
  visibleText,
  onPlayStateChange,
  onAudioElement,
  onToggleText 
}: ConversationControlsProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard");
    } catch (error) {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Copy
      </Button>
    </div>
  );
};