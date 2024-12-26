import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BriefFormSubmitButtonProps {
  isProcessing: boolean;
  isEditing: boolean;
}

export const BriefFormSubmitButton = ({ isProcessing, isEditing }: BriefFormSubmitButtonProps) => {
  return (
    <Button type="submit" disabled={isProcessing}>
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : isEditing ? (
        "Update Brief"
      ) : (
        "Submit Brief"
      )}
    </Button>
  );
};