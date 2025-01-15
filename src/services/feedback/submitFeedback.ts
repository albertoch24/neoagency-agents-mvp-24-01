import { supabase } from "@/integrations/supabase/client";
import { ValidatedHeaders } from "@/utils/headers/validateHeaders";
import { toast } from "sonner";

interface SubmitFeedbackParams {
  briefId: string;
  stageId: string;
  feedback: string;
  isPermanent: boolean;
  headers: ValidatedHeaders;
}

export const submitFeedback = async ({
  briefId,
  stageId,
  feedback,
  isPermanent,
  headers
}: SubmitFeedbackParams) => {
  console.log('🚀 Submitting feedback:', {
    briefId,
    stageId,
    feedbackLength: feedback.length,
    isPermanent,
    headers: {
      hasAuthorization: !!headers.authorization,
      hasApiKey: !!headers.apikey,
      clientInfo: headers.clientInfo
    }
  });

  const { data: feedbackData, error: insertError } = await supabase
    .from("stage_feedback")
    .insert({
      brief_id: briefId,
      stage_id: stageId,
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

  return feedbackData.id;
};