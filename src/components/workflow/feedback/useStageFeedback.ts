import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { processDocument } from "@/utils/rag/documentProcessor";
import { useQueryClient } from "@tanstack/react-query";

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
      console.log('🚀 Starting feedback submission:', {
        briefId,
        stageId,
        feedbackLength: feedback.length,
        isPermanent,
        timestamp: new Date().toISOString()
      });

      // First, get the actual stage UUID
      const { data: stageData, error: stageError } = await supabase
        .from("stages")
        .select("id")
        .eq("name", stageId)
        .single();

      if (stageError || !stageData) {
        console.error("❌ Error finding stage:", stageError);
        throw new Error("Could not find the specified stage");
      }

      // 1. Insert feedback with the correct stage UUID
      const { data: feedbackData, error: insertError } = await supabase
        .from("stage_feedback")
        .insert({
          brief_id: briefId,
          stage_id: stageData.id,
          content: feedback,
          requires_revision: true,
          is_permanent: isPermanent,
          processed_for_rag: false
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error inserting feedback:", insertError);
        throw new Error("Failed to save feedback");
      }

      const newFeedbackId = feedbackData.id;
      setFeedbackId(newFeedbackId);
      
      console.log('✅ Feedback inserted successfully:', {
        feedbackId: newFeedbackId,
        timestamp: new Date().toISOString()
      });

      // 2. Mark existing outputs as reprocessed
      console.log('🔄 Marking existing outputs as reprocessed');
      const { error: outputsError } = await supabase
        .from("brief_outputs")
        .update({
          is_reprocessed: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: newFeedbackId
        })
        .eq("brief_id", briefId)
        .eq("stage_id", stageData.id)
        .is("feedback_id", null);

      if (outputsError) {
        console.error("❌ Error updating outputs:", outputsError);
        toast.error("Feedback saved but failed to update outputs");
      }

      // 3. Mark existing conversations as reprocessing
      console.log('🔄 Marking existing conversations as reprocessing');
      const { error: convsError } = await supabase
        .from("workflow_conversations")
        .update({
          reprocessing: true,
          reprocessed_at: new Date().toISOString(),
          feedback_id: newFeedbackId
        })
        .eq("brief_id", briefId)
        .eq("stage_id", stageData.id)
        .is("feedback_id", null);

      if (convsError) {
        console.error("❌ Error updating conversations:", convsError);
        toast.error("Feedback saved but failed to update conversations");
      }

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
            .eq("id", newFeedbackId);

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
    handleSubmit,
    feedbackId
  };
};