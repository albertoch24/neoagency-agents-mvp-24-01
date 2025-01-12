import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";

interface FeedbackFormProps {
  content: string;
  rating: number;
  requiresRevision: boolean;
  isProcessing: boolean;
  embedded?: boolean;
  onContentChange: (content: string) => void;
  onRatingChange: (rating: number) => void;
  onRevisionChange: (requires: boolean) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

export const FeedbackForm = ({
  content,
  rating,
  requiresRevision,
  isProcessing,
  embedded = false,
  onContentChange,
  onRatingChange,
  onRevisionChange,
  onSubmit,
  onCancel,
}: FeedbackFormProps) => {
  return (
    <div className="space-y-4 py-4">
      <StarRating rating={rating} onRatingChange={onRatingChange} />
      <Textarea
        placeholder="Enter your feedback..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requiresRevision"
          checked={requiresRevision}
          onChange={(e) => onRevisionChange(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="requiresRevision">Requires revision</label>
      </div>
      <div className="flex justify-end space-x-2">
        {!embedded && onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={onSubmit} 
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
};