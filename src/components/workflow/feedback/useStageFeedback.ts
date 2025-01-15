import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { validateHeaders } from "@/utils/headers/validateHeaders";
import { resolveStageId } from "@/services/stage/resolveStageId";
import { submitFeedback } from "@/services/feedback/submitFeedback";
import { processRAG } from "@/services/feedback/processRAG";

interface UseStageFeedbackProps {
  briefId: string;
  stageId: string;
  brand?: string;
  onReprocess?: (feedbackId: string) => Promise<void>;
}

export const useStageFeedback = ({ briefId, stageId, brand, onReprocess }: UseStageFeedbackProps) => {
  const [feedback, setFeedback] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter feedback before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate headers
      const headers = await validateHeaders();
      
      // Resolve stage ID
      const actualStageId = await resolveStageId(stageId);

      // Submit feedback
      const newFeedbackId = await submitFeedback({
        briefId,
        stageId: actualStageId,
        feedback,
        isPermanent,
        headers
      });

      setFeedbackId(newFeedbackId);

      // Update existing outputs
      const { error: outputsError } = await supabase
        .from("brief_outputs")
        .update({
          is_reprocessed: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: newFeedbackId
        })
        .eq("brief_id", briefId)
        .eq("stage_id", actualStageId)
        .is("feedback_id", null);

      if (outputsError) {
        console.error("❌ Error updating outputs:", { error: outputsError });
        toast.error("Feedback saved but failed to update outputs");
      }

      // Update existing conversations
      const { error: convsError } = await supabase
        .from("workflow_conversations")
        .update({
          reprocessing: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: newFeedbackId
        })
        .eq("brief_id", briefId)
        .eq("stage_id", actualStageId)
        .is("feedback_id", null);

      if (convsError) {
        console.error("❌ Error updating conversations:", { error: convsError });
        toast.error("Feedback saved but failed to update conversations");
      }

      // Process RAG if permanent feedback
      if (isPermanent && brand) {
        await processRAG({
          feedbackId: newFeedbackId,
          feedback,
          brand,
          headers
        });
      }

      console.log('✅ Feedback submission completed successfully');
      toast.success("Feedback submitted successfully");
      
      // Clear the form
      setFeedback("");
      setIsPermanent(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      
      // Trigger reprocessing if provided
      if (onReprocess) {
        console.log('🔄 Triggering stage reprocessing with feedback:', {
          feedbackId: newFeedbackId,
          timestamp: new Date().toISOString()
        });
        await onReprocess(newFeedbackId);
        console.log('✅ Stage reprocessing completed');
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", {
        error,
        type: error instanceof Error ? 'Error' : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    feedback,
    setFeedback,
    isPermanent,
    setIsPermanent,
    isSubmitting,
    handleSubmit,
    feedbackId
  };
};