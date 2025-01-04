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

  // Get previous stage outputs for context
  const { data: previousOutputs } = await supabase
    .from("brief_outputs")
    .select("*")
    .eq("brief_id", brief.id)
    .lt("created_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  console.log("Found previous outputs:", previousOutputs?.length || 0);

  const outputs = [];

  // Process each step in sequence
  for (const step of flowSteps) {
    console.log("Processing flow step:", {
      stepId: step.id,
      agentId: step.agent_id,
      orderIndex: step.order_index,
      requirements: step.requirements,
      timestamp: new Date().toISOString()
    });

    // Get agent with skills
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
      requirements: step.requirements,
      timestamp: new Date().toISOString()
    });

    // Process agent with requirements and previous context
    const output = await processAgent(
      supabase, 
      agent, 
      brief, 
      stageId, 
      step.requirements,
      previousOutputs || []
    );

    // Add step metadata to output
    const enrichedOutput = {
      ...output,
      stepId: step.id,
      orderIndex: step.order_index,
      requirements: step.requirements,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description
      }
    };

    outputs.push(enrichedOutput);

    // Save conversation for this step
    if (output?.outputs?.[0]?.content) {
      console.log("Saving conversation for step:", {
        briefId: brief.id,
        stageId: stageId,
        stepId: step.id,
        agentId: agent.id,
        timestamp: new Date().toISOString()
      });

      await saveConversation(
        supabase, 
        brief.id, 
        stageId, 
        agent.id, 
        output.outputs[0].content,
        step.id // Add step ID to link conversation to specific step
      );
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

  console.log("Saving brief output with all steps:", {
    briefId: brief.id,
    stageId: stageId,
    stageName: stageName,
    outputsCount: outputs.length,
    timestamp: new Date().toISOString()
  });

  // Save complete stage output with all steps
  await saveBriefOutput(supabase, brief.id, stageId, stageName, outputs);
  return outputs;
}