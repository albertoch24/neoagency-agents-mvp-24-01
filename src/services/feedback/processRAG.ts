import { supabase } from "@/integrations/supabase/client";
import { processDocument } from "@/utils/rag/documentProcessor";
import { ValidatedHeaders } from "@/utils/headers/validateHeaders";
import { toast } from "sonner";

interface ProcessRAGParams {
  feedbackId: string;
  feedback: string;
  brand: string;
  headers: ValidatedHeaders;
}

export const processRAG = async ({
  feedbackId,
  feedback,
  brand,
  headers
}: ProcessRAGParams) => {
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
      .eq("id", feedbackId);

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
};