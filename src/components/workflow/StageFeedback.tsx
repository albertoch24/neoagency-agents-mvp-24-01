import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { processDocument } from "@/utils/rag/documentProcessor";

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
      // First, get the brief details to access the brand
      const { data: briefData, error: briefError } = await supabase
        .from("briefs")
        .select("brand")
        .eq("id", briefId)
        .single();

      if (briefError) {
        console.error("Error fetching brief data:", briefError);
        throw new Error("Failed to fetch brief details");
      }

      const { error: insertError } = await supabase
        .from("stage_feedback")
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          content: feedback,
          requires_revision: true,
          is_permanent: isPermanent,
          processed_for_rag: false
        });

      if (insertError) {
        console.error("Error inserting feedback:", insertError);
        throw new Error("Failed to save feedback");
      }

      // If it's permanent feedback, process it for RAG
      if (isPermanent && briefData?.brand) {
        console.log("Processing permanent feedback for RAG:", {
          content: feedback,
          brand: briefData.brand
        });

        try {
          // Process the document for RAG with metadata
          await processDocument(feedback, {
            source: "stage_feedback",
            brand: briefData.brand,
            type: "feedback"
          });

          // Update the feedback record to mark it as processed
          const { error: updateError } = await supabase
            .from("stage_feedback")
            .update({ processed_for_rag: true })
            .eq("brief_id", briefId)
            .eq("stage_id", stageId);

          if (updateError) {
            console.error("Error updating RAG processing status:", updateError);
            // Don't throw here, as the feedback was still saved
            toast.error("Feedback saved but failed to process for brand knowledge");
          }
        } catch (ragError) {
          console.error("Error processing feedback for RAG:", ragError);
          // Don't throw here, as the feedback was still saved
          toast.error("Feedback saved but failed to process for brand knowledge");
        }
      }

      toast.success("Feedback submitted successfully");
      setFeedback("");
      setIsPermanent(false);
      queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback");
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