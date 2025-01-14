import { createClient } from "@supabase/supabase-js";
import { FeedbackProcessor } from "./FeedbackProcessor.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function processFeedbackWithLangChain(
  briefId: string,
  stageId: string,
  feedbackId: string
) {
  try {
    console.log("🚀 Starting LangChain feedback processing:", {
      briefId,
      stageId,
      feedbackId
    });

    // Get feedback content
    const { data: feedback, error: feedbackError } = await supabase
      .from("stage_feedback")
      .select("*")
      .eq("id", feedbackId)
      .single();

    if (feedbackError) throw feedbackError;

    // Get original context
    const { data: originalOutput, error: outputError } = await supabase
      .from("brief_outputs")
      .select("content")
      .eq("brief_id", briefId)
      .eq("stage_id", stageId)
      .eq("is_reprocessed", false)
      .maybeSingle();

    if (outputError) throw outputError;

    // Process feedback
    const processor = new FeedbackProcessor();
    const newResponse = await processor.processFeedback(
      feedback.content,
      JSON.stringify(originalOutput?.content || {})
    );

    // Save new output
    const { error: saveError } = await supabase
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        content: newResponse,
        feedback_id: feedbackId,
        is_reprocessed: true,
        reprocessed_at: new Date().toISOString()
      });

    if (saveError) throw saveError;

    console.log("✅ LangChain feedback processing completed successfully");
    return newResponse;

  } catch (error) {
    console.error("❌ Error in LangChain feedback processing:", error);
    throw error;
  }
}