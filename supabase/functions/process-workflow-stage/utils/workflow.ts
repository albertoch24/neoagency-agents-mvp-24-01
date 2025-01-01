import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAgentResponse } from "./openai.ts";

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

    // Construct conversational prompt
    const conversationalPrompt = `
      As ${agent.name}, analyze this creative brief in a natural, conversational way:
      
      Brief Details:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      Your Role and Background:
      ${agent.description}
      
      Your Skills:
      ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
      
      Share your thoughts as if you're speaking in a creative agency meeting. Be natural, use conversational language, 
      express your professional opinion, and make it feel like a real conversation.
      
      Remember to:
      1. Use first-person pronouns ("I think...", "In my experience...")
      2. Include verbal fillers and transitions natural to spoken language
      3. Express enthusiasm and emotion where appropriate
      4. Reference team dynamics and collaborative aspects
      5. Use industry jargon naturally but explain complex concepts
      6. Share personal insights and experiences
      7. Ask rhetorical questions to engage others
      8. Use informal but professional language
    `;

    // Construct schematic prompt (pre-edit 313 style)
    const schematicPrompt = `
      As ${agent.name}, provide a structured analysis of this brief:
      
      Brief Details:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      Your Role:
      ${agent.description}
      
      Skills Applied:
      ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
      
      Provide a clear, bullet-pointed list of key points and recommendations. 
      Focus on actionable insights and concrete steps.
      Format your response as a structured list with clear categories and sub-points.
    `;

    console.log("Generating conversational response...");
    const conversationalContent = await generateAgentResponse(conversationalPrompt);
    
    console.log("Generating schematic response...");
    const schematicContent = await generateAgentResponse(schematicPrompt);

    // Save the conversational output
    const conversationalOutput = {
      brief_id: brief.id,
      stage_id: stageId,
      agent_id: agent.id,
      content: conversationalContent.trim(),
      output_type: 'conversational',
      created_at: new Date().toISOString()
    };

    // Save the schematic output
    const schematicOutput = {
      brief_id: brief.id,
      stage_id: stageId,
      agent_id: agent.id,
      content: schematicContent.trim(),
      output_type: 'summary',
      created_at: new Date().toISOString()
    };

    // Insert both outputs into the database
    const { error: conversationalError } = await supabase
      .from('workflow_conversations')
      .insert([conversationalOutput]);

    if (conversationalError) {
      throw new Error(`Error saving conversational output: ${conversationalError.message}`);
    }

    const { error: schematicError } = await supabase
      .from('workflow_conversations')
      .insert([schematicOutput]);

    if (schematicError) {
      throw new Error(`Error saving schematic output: ${schematicError.message}`);
    }

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });

    return {
      conversational: conversationalContent.trim(),
      summary: schematicContent.trim()
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