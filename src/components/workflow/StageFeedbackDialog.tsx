import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StageFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  stageId: string;
  briefId: string;
}

export const StageFeedbackDialog = ({
  open,
  onClose,
  stageId,
  briefId,
}: StageFeedbackDialogProps) => {
  const [feedback, setFeedback] = useState("");
  const [requiresRevision, setRequiresRevision] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("stage_feedback").insert({
        stage_id: stageId,
        brief_id: briefId,
        content: feedback,
        requires_revision: requiresRevision
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully");
      
      // Solo se richiede revisione, mostra un messaggio informativo
      if (requiresRevision) {
        toast.info(
          "Revision requested. Please wait for the team to review your feedback.",
          { duration: 5000 }
        );
      }

      setFeedback("");
      setRequiresRevision(false);
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stage Feedback</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Please provide your feedback for this stage..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requires-revision"
              checked={requiresRevision}
              onChange={(e) => setRequiresRevision(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="requires-revision" className="text-sm text-gray-700">
              This stage requires revision
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};