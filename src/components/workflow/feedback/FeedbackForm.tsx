import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FeedbackFormProps {
  feedback: string;
  isPermanent: boolean;
  isSubmitting: boolean;
  onFeedbackChange: (value: string) => void;
  onPermanentChange: (checked: boolean) => void;
  onSubmit: () => void;
}

export const FeedbackForm = ({
  feedback,
  isPermanent,
  isSubmitting,
  onFeedbackChange,
  onPermanentChange,
  onSubmit,
}: FeedbackFormProps) => {
  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter your feedback for this stage..."
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id="permanent"
          checked={isPermanent}
          onCheckedChange={(checked) => onPermanentChange(checked as boolean)}
        />
        <label
          htmlFor="permanent"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Save as brand knowledge (will be used for future briefs)
        </label>
      </div>
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting and Reprocessing...
          </>
        ) : (
          "Submit Feedback & Reprocess"
        )}
      </Button>
    </div>
  );
};