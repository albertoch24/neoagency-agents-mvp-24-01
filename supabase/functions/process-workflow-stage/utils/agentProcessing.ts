import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import { collectAgentFeedback, generateAgentFeedback } from "./feedback.ts";
import { processAgentPrompt } from "./openai.ts";

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
      const response = await processAgentPrompt(openai, prompt, agent.temperature);
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