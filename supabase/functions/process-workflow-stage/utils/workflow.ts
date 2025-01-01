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

    // Construct conversational prompt with natural dialogue focus
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

    // Construct pre-edit 313 style schematic prompt
    const schematicPrompt = `
      As ${agent.name}, analyze this creative brief and provide a structured response:
      
      Brief Details:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      Your Role:
      ${agent.description}
      
      Skills Applied:
      ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
      
      Provide a clear, structured analysis following these guidelines:
      1. Key Insights
      2. Strategic Recommendations
      3. Action Items
      4. Potential Challenges
      5. Success Metrics
      
      Format your response with clear headings and bullet points.
      Focus on concrete, actionable items and measurable outcomes.
      Keep the tone professional and direct.
    `;

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