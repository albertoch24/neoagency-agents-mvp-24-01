import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateWorkflowData } from "./validation.ts";
import { generateAgentResponse } from "./openai.ts";
import { withRetry } from "./retry.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export async function processAgents(briefId: string, stageId: string) {
  console.log('Starting agent processing:', { briefId, stageId });
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Validate all required data
    const { brief, stage } = await validateWorkflowData(briefId, stageId);
    
    const flowSteps = stage.flows?.flow_steps || [];
    console.log('Processing flow steps:', flowSteps.length);
    
    const outputs = [];
    
    // Process each flow step sequentially
    for (const step of flowSteps) {
      console.log('Processing step:', {
        stepId: step.id,
        agentId: step.agent_id,
        requirements: step.requirements
      });
      
      const agent = step.agents;
      if (!agent) {
        throw new Error(`Agent not found for step ${step.id}`);
      }
      
      // Build the prompt
      const prompt = `You are ${agent.name}. ${agent.description || ''}

Brief Title: ${brief.title}
Brief Description: ${brief.description || ''}
Brief Objectives: ${brief.objectives || ''}

Your task: ${step.requirements || 'Analyze the brief and provide insights'}

Please provide your response in a clear, structured format.`;
      
      // Generate response with retries
      const response = await generateAgentResponse(
        prompt,
        agent.temperature || 0.7
      );
      
      // Save conversation
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
        console.error('Error saving conversation:', convError);
        throw convError;
      }
      
      outputs.push({
        agent,
        requirements: step.requirements,
        outputs: [{ content: response }],
        stepId: step.id,
        conversation
      });
      
      console.log('Step processed successfully:', step.id);
    }
    
    return outputs;
    
  } catch (error) {
    console.error('Error in processAgents:', error);
    throw error;
  }
}