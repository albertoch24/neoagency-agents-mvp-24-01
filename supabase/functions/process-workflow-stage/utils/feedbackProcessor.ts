import { createClient } from "@supabase/supabase-js";
import { FeedbackProcessor } from "./FeedbackProcessor.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function processFeedbackWithLangChain(
  briefId: string,
  stageId: string,
  feedbackId: string,
  originalOutput: any
) {
  try {
    console.log("🚀 Starting LangChain feedback processing:", {
      briefId,
      stageId,
      feedbackId,
      hasOriginalOutput: !!originalOutput,
      timestamp: new Date().toISOString()
    });

    // 1. Get feedback content
    const { data: feedback, error: feedbackError } = await supabase
      .from("stage_feedback")
      .select("*")
      .eq("id", feedbackId)
      .single();

    if (feedbackError) {
      console.error("❌ Error fetching feedback:", feedbackError);
      throw feedbackError;
    }

    console.log("✅ Feedback fetched successfully:", {
      feedbackContent: feedback.content,
      timestamp: new Date().toISOString()
    });

    // 2. Process feedback with original output context
    const processor = new FeedbackProcessor();
    console.log("🔄 Processing feedback with LangChain...");
    
    const newResponse = await processor.processFeedback(
      feedback.content,
      JSON.stringify(originalOutput.content || {})
    );

    console.log("✅ Feedback processed successfully:", {
      hasNewResponse: !!newResponse,
      timestamp: new Date().toISOString()
    });

    // 3. Save new output
    const { error: saveError } = await supabase
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        content: newResponse,
        feedback_id: feedbackId,
        is_reprocessed: true,
        original_output_id: originalOutput.id,
        reprocessed_at: new Date().toISOString()
      });

    if (saveError) {
      console.error("❌ Error saving new output:", saveError);
      throw saveError;
    }

    console.log("✅ New output saved successfully");
    return newResponse;

  } catch (error) {
    console.error("❌ Error in LangChain feedback processing:", {
      error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}