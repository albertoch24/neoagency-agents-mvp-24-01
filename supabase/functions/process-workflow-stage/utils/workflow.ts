import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAgentResponse } from "./openai.ts";
import { buildPrompt } from "./promptBuilder.ts";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log("Starting agent processing with full context:", {
    brief: {
      id: brief.id,
      title: brief.title,
      description: brief.description,
      objectives: brief.objectives,
      status: brief.status,
      current_stage: brief.current_stage
    },
    stage: {
      id: stageId
    },
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      skillCount: agent.skills?.length || 0
    }
  });

  try {
    // Validate all required data exists
    if (!brief.id || !stageId || !agent.id) {
      const missingData = [];
      if (!brief.id) missingData.push('briefId');
      if (!stageId) missingData.push('stageId');
      if (!agent.id) missingData.push('agentId');
      
      console.error("Missing required data:", missingData);
      throw new Error(`Missing required data: ${missingData.join(', ')}`);
    }

    // Check if this is the first stage
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('id, order_index')
      .order('order_index', { ascending: true });

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      throw stagesError;
    }

    const currentStageIndex = stages.findIndex((s: any) => s.id === stageId);
    const isFirstStage = currentStageIndex === 0;

    // Fetch previous stage outputs if not first stage
    const previousOutputs = isFirstStage ? [] : await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', brief.id)
      .order('created_at', { ascending: true });

    // Log agent skills
    if (agent.skills && agent.skills.length > 0) {
      console.log("Processing agent skills:", agent.skills.map((skill: any) => ({
        skillId: skill.id,
        name: skill.name,
        type: skill.type,
        hasContent: !!skill.content
      })));
    } else {
      console.warn("Agent has no skills:", {
        agentId: agent.id,
        agentName: agent.name
      });
    }

    // Build prompts using the promptBuilder
    const { conversationalPrompt, schematicPrompt } = buildPrompt(
      agent,
      brief,
      previousOutputs?.data || [],
      requirements,
      isFirstStage
    );

    console.log("Generating conversational response...");
    const conversationalContent = await generateAgentResponse(conversationalPrompt);
    
    console.log("Generating schematic response...");
    const schematicContent = await generateAgentResponse(schematicPrompt);

    if (!conversationalContent || !schematicContent) {
      throw new Error(`Failed to generate content for agent: ${agent.name}`);
    }

    // Save the conversational output
    const { error: conversationalError } = await supabase
      .from('workflow_conversations')
      .insert([{
        brief_id: brief.id,
        stage_id: stageId,
        agent_id: agent.id,
        content: conversationalContent.trim(),
        output_type: 'conversational'
      }]);

    if (conversationalError) {
      throw new Error(`Error saving conversational output: ${conversationalError.message}`);
    }

    // Save the schematic output
    const { error: schematicError } = await supabase
      .from('workflow_conversations')
      .insert([{
        brief_id: brief.id,
        stage_id: stageId,
        agent_id: agent.id,
        content: schematicContent.trim(),
        output_type: 'summary'
      }]);

    if (schematicError) {
      throw new Error(`Error saving schematic output: ${schematicError.message}`);
    }

    // Generate and save stage summary
    const { error: summaryError } = await supabase.functions.invoke('generate-stage-summary', {
      body: { 
        briefId: brief.id,
        stageId: stageId
      }
    });

    if (summaryError) {
      console.error("Error generating stage summary:", summaryError);
    }

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });

    return {
      agent: agent.name,
      outputs: [
        {
          content: conversationalContent.trim()
        }
      ]
    };
  } catch (error) {
    console.error("Error in agent processing:", {
      error: error.message,
      briefId: brief?.id,
      stageId: stageId,
      agentId: agent?.id,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}