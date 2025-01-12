import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, StarHalf } from "lucide-react";

interface StageFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  briefId: string;
}

export const StageFeedbackDialog = ({
  isOpen,
  onClose,
  stageId,
  briefId,
}: StageFeedbackDialogProps) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [requiresRevision, setRequiresRevision] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from("stage_feedback").insert({
        stage_id: stageId,
        brief_id: briefId,
        content,
        rating,
        requires_revision: requiresRevision,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
      toast.success("Feedback submitted successfully");
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Provide Stage Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
              >
                {value <= rating ? (
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarHalf className="h-6 w-6 text-gray-300" />
                )}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Enter your feedback..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiresRevision"
              checked={requiresRevision}
              onChange={(e) => setRequiresRevision(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="requiresRevision">Requires revision</label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content || rating === 0}>
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};