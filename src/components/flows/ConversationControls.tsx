import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

export interface ConversationControlsProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const ConversationControls = ({
  isVisible,
  onToggle,
}: ConversationControlsProps) => {
  return (
    <div className="absolute right-2 top-2 z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={isVisible ? "bg-muted/50" : ""}
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};