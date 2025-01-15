import { SupabaseClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { PromptTemplate } from "https://esm.sh/@langchain/core/prompts@0.0.8";

export class FeedbackProcessor {
  private supabase: SupabaseClient;
  private model: ChatOpenAI;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: Deno.env.get("OPENAI_API_KEY"),
    });
  }

  async processFeedback(briefId: string, stageId: string, feedbackId: string, originalOutput: any) {
    try {
      console.log('🔄 Starting feedback processing:', { briefId, stageId, feedbackId });

      // 1. Get feedback content
      const { data: feedback, error: feedbackError } = await this.supabase
        .from('stage_feedback')
        .select('*')
        .eq('id', feedbackId)
        .single();

      if (feedbackError) {
        throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);
      }

      // 2. Process the feedback with LangChain
      const prompt = PromptTemplate.fromTemplate(`
        Original output:
        {originalOutput}

        Feedback received:
        {feedback}

        Please analyze this feedback and generate an improved version of the output that:
        1. Addresses all points in the feedback
        2. Maintains the original structure and format
        3. Preserves any valid aspects of the original output
        4. Improves areas mentioned in the feedback

        Provide the complete revised output:
      `);

      const chain = prompt.pipe(this.model);
      const response = await chain.invoke({
        originalOutput: JSON.stringify(originalOutput.content),
        feedback: feedback.content
      });

      // 3. Create new output with feedback incorporated
      const { data: newOutput, error: insertError } = await this.supabase
        .from('brief_outputs')
        .insert({
          brief_id: briefId,
          stage_id: stageId,
          content: JSON.parse(response.content),
          feedback_id: feedbackId,
          is_reprocessed: true,
          original_output_id: originalOutput.id
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create new output: ${insertError.message}`);
      }

      // 4. Update feedback processing status
      await this.supabase
        .from('feedback_processing_status')
        .update({
          update_status: 'completed',
          output_updates: 1,
          last_output_update: new Date().toISOString()
        })
        .eq('feedback_id', feedbackId);

      console.log('✅ Feedback processing completed successfully');
      
      return {
        originalOutput,
        feedback,
        newOutput
      };

    } catch (error) {
      console.error('❌ Error in feedback processing:', error);
      throw error;
    }
  }
}