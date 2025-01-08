import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

async function collectAgentFeedback(
  supabase: any,
  conversationId: string,
  reviewerAgentId: string,
  content: string,
  rating: number
) {
  const { error } = await supabase
    .from('agent_feedback')
    .insert({
      conversation_id: conversationId,
      reviewer_agent_id: reviewerAgentId,
      content,
      rating,
    });

  if (error) throw error;
}

export async function processAgents(
  supabase: any,
  flowSteps: any[],
  brief: any,
  stageId: string,
  stageName: string
) {
  console.log("Starting agent processing with flow steps:", flowSteps);
  
  const outputs = [];
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  
  const openai = new OpenAIApi(configuration);

  for (const step of flowSteps) {
    console.log(`Processing step for agent ${step.agent_id}`);
    
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', step.agent_id)
      .single();

    if (!agent) {
      throw new Error(`Agent ${step.agent_id} not found`);
    }

    const prompt = `You are ${agent.name}. ${agent.description || ''}

Brief Title: ${brief.title}
Brief Description: ${brief.description || ''}
Brief Objectives: ${brief.objectives || ''}

Your task: ${step.requirements || 'Analyze the brief and provide insights'}

Please provide your response in a clear, structured format.`;

    try {
      console.log("Sending prompt to OpenAI:", prompt);
      
      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      const response = completion.data.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      console.log("Received response from OpenAI:", response);

      const { data: conversation, error: convError } = await supabase
        .from('workflow_conversations')
        .insert({
          brief_id: brief.id,
          stage_id: stageId,
          agent_id: step.agent_id,
          content: response,
          flow_step_id: step.id
        })
        .select()
        .single();

      if (convError) throw convError;

      outputs.push({
        agent: agent,
        requirements: step.requirements,
        outputs: [{ content: response }],
        stepId: step.id,
        orderIndex: step.order_index,
        conversation: conversation
      });

    } catch (error) {
      console.error(`Error processing agent ${agent.name}:`, error);
      throw error;
    }
  }

  // After each agent processes, collect feedback from other agents
  for (const output of outputs) {
    const otherAgents = outputs.filter(o => o.agent.id !== output.agent.id);
    
    for (const reviewer of otherAgents) {
      const feedback = await generateAgentFeedback(
        openai,
        output.conversation.content,
        reviewer.agent.name,
        reviewer.agent.description
      );
      
      await collectAgentFeedback(
        supabase,
        output.conversation.id,
        reviewer.agent.id,
        feedback.content,
        feedback.rating
      );
    }
  }

  return outputs;
}

async function generateAgentFeedback(
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

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  const feedbackText = response.data.choices[0]?.message?.content || "";
  const ratingMatch = feedbackText.match(/Rating:\s*(\d+)/);
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;
  const feedback = feedbackText.replace(/Rating:\s*\d+/, "").replace("Feedback:", "").trim();

  return {
    content: feedback,
    rating: Math.min(Math.max(rating, 1), 5), // Ensure rating is between 1-5
  };
}