import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processDocument } from "@/utils/rag/documentProcessor";
import { useQueryClient } from "@tanstack/react-query";

interface UseStageFeedbackProps {
  briefId: string;
  stageId: string;
  brand?: string;
  onReprocess?: () => Promise<void>;
}

export const useStageFeedback = ({ briefId, stageId, brand, onReprocess }: UseStageFeedbackProps) => {
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
      console.log('🚀 Starting feedback submission:', {
        briefId,
        stageId,
        feedbackLength: feedback.length,
        isPermanent,
        timestamp: new Date().toISOString()
      });

      console.log('📝 Inserting feedback:', {
        briefId,
        stageId,
        isPermanent,
        timestamp: new Date().toISOString()
      });

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
        console.error("❌ Error inserting feedback:", insertError);
        throw new Error("Failed to save feedback");
      }

      console.log('✅ Feedback inserted successfully');

      if (isPermanent && brand) {
        console.log("🔄 Processing permanent feedback for RAG:", {
          content: feedback,
          brand,
          timestamp: new Date().toISOString()
        });

        try {
          await processDocument(feedback, {
            source: "stage_feedback",
            brand,
            type: "feedback"
          });

          console.log('📝 Updating RAG processing status');
          const { error: updateError } = await supabase
            .from("stage_feedback")
            .update({ processed_for_rag: true })
            .eq("brief_id", briefId)
            .eq("stage_id", stageId);

          if (updateError) {
            console.error("❌ Error updating RAG processing status:", updateError);
            toast.error("Feedback saved but failed to process for brand knowledge");
          }
        } catch (ragError) {
          console.error("❌ Error processing feedback for RAG:", ragError);
          toast.error("Feedback saved but failed to process for brand knowledge");
        }
      }

      console.log('✅ Feedback submission completed successfully');
      toast.success("Feedback submitted successfully");
      
      // Clear the form
      setFeedback("");
      setIsPermanent(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stage-feedback"] });
      
      // Trigger reprocessing if provided
      if (onReprocess) {
        console.log('🔄 Triggering stage reprocessing');
        await onReprocess();
        console.log('✅ Stage reprocessing completed');
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
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
    handleSubmit
  };
};