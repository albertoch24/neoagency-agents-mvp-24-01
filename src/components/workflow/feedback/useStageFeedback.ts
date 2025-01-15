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

const validateHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    authorization: session?.access_token,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    clientInfo: window.navigator.userAgent
  };

  console.log('🔍 Validating request headers:', {
    hasAuthorization: !!headers.authorization,
    hasApiKey: !!headers.apikey,
    clientInfo: headers.clientInfo,
    timestamp: new Date().toISOString()
  });

  if (!headers.authorization) {
    throw new Error("Missing authorization header - user not authenticated");
  }

  if (!headers.apikey) {
    throw new Error("Missing API key - check Supabase configuration");
  }

  return headers;
};

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
      // Validate headers before proceeding
      const headers = validateHeaders();
      
      console.log('🚀 Starting feedback submission:', {
        briefId,
        stageId,
        feedbackLength: feedback.length,
        isPermanent,
        headers: {
          hasAuthorization: !!headers.authorization,
          hasApiKey: !!headers.apikey,
          clientInfo: headers.clientInfo
        },
        timestamp: new Date().toISOString()
      });

      // First, if stageId is not a UUID, fetch the actual stage UUID
      let actualStageId = stageId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stageId)) {
        console.log('Fetching actual stage ID for:', stageId);
        
        // Try exact match first
        let { data: stageData, error: stageError } = await supabase
          .from('stages')
          .select('id')
          .eq('name', stageId)
          .maybeSingle();

        // If no exact match, try with capitalized first letters
        if (!stageData) {
          const capitalizedName = stageId
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
            
          console.log('Trying with capitalized name:', capitalizedName);
          
          const result = await supabase
            .from('stages')
            .select('id')
            .eq('name', capitalizedName)
            .maybeSingle();
            
          stageData = result.data;
          stageError = result.error;
        }

        if (stageError) {
          console.error("❌ Error fetching stage:", stageError);
          throw new Error("Failed to find stage");
        }

        if (!stageData) {
          console.error("❌ Stage not found:", stageId);
          throw new Error(`Stage not found: ${stageId}. Please check the stage name.`);
        }

        actualStageId = stageData.id;
        console.log('Found actual stage ID:', actualStageId);
      }

      // 1. Insert feedback with the stage UUID
      const { data: feedbackData, error: insertError } = await supabase
        .from("stage_feedback")
        .insert({
          brief_id: briefId,
          stage_id: actualStageId,
          content: feedback,
          requires_revision: true,
          is_permanent: isPermanent,
          processed_for_rag: false
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error inserting feedback:", {
          error: insertError,
          headers: {
            hasAuthorization: !!headers.authorization,
            hasApiKey: !!headers.apikey
          }
        });
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
        .eq("stage_id", actualStageId)
        .is("feedback_id", null);

      if (outputsError) {
        console.error("❌ Error updating outputs:", {
          error: outputsError,
          headers: {
            hasAuthorization: !!headers.authorization,
            hasApiKey: !!headers.apikey
          }
        });
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
        .eq("stage_id", actualStageId)
        .is("feedback_id", null);

      if (convsError) {
        console.error("❌ Error updating conversations:", {
          error: convsError,
          headers: {
            hasAuthorization: !!headers.authorization,
            hasApiKey: !!headers.apikey
          }
        });
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
            console.error("❌ Error updating RAG processing status:", {
              error: updateError,
              headers: {
                hasAuthorization: !!headers.authorization,
                hasApiKey: !!headers.apikey
              }
            });
            toast.error("Feedback saved but failed to process for brand knowledge");
          }
        } catch (ragError) {
          console.error("❌ Error processing feedback for RAG:", {
            error: ragError,
            headers: {
              hasAuthorization: !!headers.authorization,
              hasApiKey: !!headers.apikey
            }
          });
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