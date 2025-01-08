import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function collectAgentFeedback(
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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Operation failed, retrying... (${retries} attempts left)`);
      await delay(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export async function processAgents(
  supabase: any,
  flowSteps: any[],
  brief: any,
  stageId: string,
  stageName: string
) {
  console.log("Starting agent processing with flow steps:", 
    flowSteps.map(step => ({
      id: step.id,
      agentId: step.agent_id,
      requirements: step.requirements
    }))
  );
  
  const outputs = [];
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  
  const openai = new OpenAIApi(configuration);

  for (const step of flowSteps) {
    console.log(`Processing step for agent ${step.agent_id}`);
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', step.agent_id)
      .single();

    if (agentError) {
      console.error(`Error fetching agent ${step.agent_id}:`, agentError);
      throw agentError;
    }

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
      
      const completion = await retryOperation(async () => {
        const response = await openai.createChatCompletion({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: 'You are a creative agency professional. Provide detailed, actionable insights.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: agent.temperature || 0.7,
        });
        return response;
      });

      const response = completion.data.choices[0]?.message?.content;
      
      if (!response) {
        console.error('No response from OpenAI');
        throw new Error('No response from OpenAI');
      }

      console.log("Received response from OpenAI:", response.substring(0, 100) + '...');

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

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

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
  console.log("Starting feedback collection between agents");
  
  for (const output of outputs) {
    const otherAgents = outputs.filter(o => o.agent.id !== output.agent.id);
    
    for (const reviewer of otherAgents) {
      try {
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
      } catch (error) {
        console.error('Error collecting feedback:', error);
        // Continue with other feedback even if one fails
      }
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