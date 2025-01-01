import { createSupabaseClient } from './database.ts';
import { processAgent } from './workflow.ts';
import { saveConversation, saveBriefOutput } from './database.ts';

export async function processAgents(
  supabase: any,
  flowSteps: any[],
  brief: any,
  stageId: string,
  stageName: string
) {
  console.log("Starting agent processing for stage:", {
    stageName,
    stageId,
    briefId: brief.id,
    flowStepsCount: flowSteps.length,
    timestamp: new Date().toISOString()
  });

  const outputs = [];

  for (const step of flowSteps) {
    console.log("Processing flow step:", {
      stepId: step.id,
      agentId: step.agent_id,
      orderIndex: step.order_index,
      timestamp: new Date().toISOString()
    });

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select(`
        *,
        skills (*)
      `)
      .eq("id", step.agent_id)
      .maybeSingle();

    if (agentError || !agent) {
      console.error("Agent validation failed:", {
        stepId: step.id,
        agentId: step.agent_id,
        error: agentError,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Agent not found for step: ${step.id}`);
    }

    console.log("Agent validation successful:", {
      agentId: agent.id,
      agentName: agent.name,
      skillsCount: agent.skills?.length || 0,
      timestamp: new Date().toISOString()
    });

    const output = await processAgent(supabase, agent, brief, stageId, step.requirements);
    outputs.push(output);

    if (output?.outputs?.[0]?.content) {
      console.log("Saving conversation:", {
        briefId: brief.id,
        stageId: stageId,
        agentId: agent.id,
        timestamp: new Date().toISOString()
      });

      await saveConversation(supabase, brief.id, stageId, agent.id, output.outputs[0].content);
    } else {
      console.error("Invalid output format from agent:", {
        agentId: agent.id,
        agentName: agent.name,
        output,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Invalid output format from agent: ${agent.name}`);
    }
  }

  console.log("Saving brief output:", {
    briefId: brief.id,
    stageId: stageId,
    stageName: stageName,
    outputsCount: outputs.length,
    timestamp: new Date().toISOString()
  });

  await saveBriefOutput(supabase, brief.id, stageId, stageName, outputs);
  return outputs;
}