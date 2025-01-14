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
      feedbackId,
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

    // 2. Get original context
    const { data: originalOutput, error: outputError } = await supabase
      .from("brief_outputs")
      .select("content")
      .eq("brief_id", briefId)
      .eq("stage_id", stageId)
      .eq("is_reprocessed", false)
      .maybeSingle();

    if (outputError) {
      console.error("❌ Error fetching original output:", outputError);
      throw outputError;
    }

    console.log("✅ Original output fetched:", {
      hasOutput: !!originalOutput,
      timestamp: new Date().toISOString()
    });

    // 3. Process feedback
    const processor = new FeedbackProcessor();
    console.log("🔄 Processing feedback with LangChain...");
    
    const newResponse = await processor.processFeedback(
      feedback.content,
      JSON.stringify(originalOutput?.content || {})
    );

    console.log("✅ Feedback processed successfully:", {
      hasNewResponse: !!newResponse,
      timestamp: new Date().toISOString()
    });

    // 4. Save new output
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