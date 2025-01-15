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
      console.error("❌ Error fetching feedback:", {
        error: feedbackError,
        feedbackId,
        timestamp: new Date().toISOString()
      });
      throw feedbackError;
    }

    console.log("✅ Feedback fetched successfully:", {
      feedbackContent: feedback.content,
      feedbackId: feedback.id,
      timestamp: new Date().toISOString()
    });

    // 2. Get original output content for specific stage - Debug query
    console.log("🔍 Fetching original output with query params:", {
      briefId,
      stageId,
      timestamp: new Date().toISOString()
    });

    const { data: originalOutput, error: outputError } = await supabase
      .from("brief_outputs")
      .select("id, content")
      .eq("brief_id", briefId)
      .eq("stage_id", stageId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (outputError) {
      console.error("❌ Error fetching original output:", {
        error: outputError,
        briefId,
        stageId,
        timestamp: new Date().toISOString()
      });
      throw outputError;
    }

    if (!originalOutput) {
      console.error("❌ No original output found:", {
        briefId,
        stageId,
        timestamp: new Date().toISOString()
      });

      // Debug query to check all outputs for this brief
      const { data: allOutputs } = await supabase
        .from("brief_outputs")
        .select("id, stage_id, created_at, is_reprocessed")
        .eq("brief_id", briefId);

      console.log("📊 All outputs for this brief:", {
        outputsCount: allOutputs?.length || 0,
        outputs: allOutputs,
        timestamp: new Date().toISOString()
      });

      throw new Error(`No original output found for stage ${stageId}`);
    }

    console.log("✅ Original output fetched:", {
      outputId: originalOutput.id,
      hasContent: !!originalOutput.content,
      contentSample: JSON.stringify(originalOutput.content).substring(0, 100),
      timestamp: new Date().toISOString()
    });

    // 3. Process feedback with original content
    const processor = new FeedbackProcessor();
    console.log("🔄 Processing feedback with LangChain...");
    
    const newResponse = await processor.processFeedback(
      feedback.content,
      JSON.stringify(originalOutput.content)
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
        original_output_id: originalOutput.id,
        reprocessed_at: new Date().toISOString()
      });

    if (saveError) {
      console.error("❌ Error saving new output:", {
        error: saveError,
        timestamp: new Date().toISOString()
      });
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