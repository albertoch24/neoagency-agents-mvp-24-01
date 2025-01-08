import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import { retryOperation } from "./retry.ts";

export async function collectAgentFeedback(
  supabase: any,
  conversationId: string,
  reviewerAgentId: string,
  content: string,
  rating: number
) {
  console.log('Collecting feedback:', { conversationId, reviewerAgentId, rating });
  
  const { error } = await supabase
    .from('agent_feedback')
    .insert({
      conversation_id: conversationId,
      reviewer_agent_id: reviewerAgentId,
      content,
      rating,
    });

  if (error) {
    console.error('Error collecting feedback:', error);
    throw error;
  }
}

export async function generateAgentFeedback(
  openai: OpenAIApi,
  content: string,
  reviewerName: string,
  reviewerDescription: string
): Promise<{ content: string; rating: number }> {
  const prompt = `As ${reviewerName} (${reviewerDescription}), provide constructive feedback on the following content from another team member. Include both positive aspects and areas for improvement. Rate the content from 1-5 stars based on its effectiveness and alignment with project goals.

Content to review:
${content}

Provide your feedback in the following format:
Feedback: [Your detailed feedback]
Rating: [1-5]`;

  try {
    const response = await retryOperation(async () => {
      const completion = await openai.createChatCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      return completion;
    });

    const feedbackText = response.data.choices[0]?.message?.content || "";
    const ratingMatch = feedbackText.match(/Rating:\s*(\d+)/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;
    const feedback = feedbackText.replace(/Rating:\s*\d+/, "").replace("Feedback:", "").trim();

    return {
      content: feedback,
      rating: Math.min(Math.max(rating, 1), 5), // Ensure rating is between 1-5
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw error;
  }
}