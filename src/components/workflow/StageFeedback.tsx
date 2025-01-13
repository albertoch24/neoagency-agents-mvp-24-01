import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface StageFeedbackProps {
  briefId: string;
  stageId: string;
  onReprocess?: () => void;
}

export const StageFeedback = ({ briefId, stageId, onReprocess }: StageFeedbackProps) => {
  const [feedback, setFeedback] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter feedback before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("stage_feedback")
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          content: feedback,
          requires_revision: true,
          is_permanent: isPermanent,
          processed_for_rag: false // Will be processed by a background job if is_permanent is true
        });

      if (error) throw error;

      toast.success("Feedback submitted successfully");
      setFeedback("");
      setIsPermanent(false);
      queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Stage Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter your feedback for this stage..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="permanent"
            checked={isPermanent}
            onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
          />
          <label
            htmlFor="permanent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save as brand knowledge (will be used for future briefs)
          </label>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
          {onReprocess && (
            <Button 
              variant="outline" 
              onClick={onReprocess}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reprocess Stage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};