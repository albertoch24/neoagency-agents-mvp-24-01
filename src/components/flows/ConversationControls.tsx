import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationControlsProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ConversationControls = ({ isVisible, onToggle }: ConversationControlsProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2",
        isVisible && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      onClick={onToggle}
    >
      <Type className="h-4 w-4" />
      {isVisible ? "Hide Team conversation" : "Show Team conversation"}
    </Button>
  );
};